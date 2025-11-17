// Configuration
const SUPABASE_URL = 'https://zknyztmngccsxdtiddvz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprbnl6dG1uZ2Njc3hkdGlkZHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMjYyMDUsImV4cCI6MjA3ODcwMjIwNX0.sV11EDMAVx0hLRNYAwvYvtkjNbMAuijPmoP8QAa2tTo';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elements
let signinForm, signupForm, forgotPasswordForm;
let signinBtn, signupBtn, resetBtn, backToSigninBtn;
let signinEmail, signinPassword;
let signupEmail, signupPassword, signupConfirmPassword;
let resetEmail;
let authStatus, confirmationMessage;
let authContainer;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  signinForm = document.getElementById('signin-form');
  signupForm = document.getElementById('signup-form');
  forgotPasswordForm = document.getElementById('forgot-password-form');

  signinBtn = document.getElementById('signin-btn');
  signupBtn = document.getElementById('signup-btn');
  resetBtn = document.getElementById('reset-btn');
  backToSigninBtn = document.getElementById('back-to-signin-btn');

  signinEmail = document.getElementById('signin-email');
  signinPassword = document.getElementById('signin-password');

  signupEmail = document.getElementById('signup-email');
  signupPassword = document.getElementById('signup-password');
  signupConfirmPassword = document.getElementById('signup-confirm-password');

  resetEmail = document.getElementById('reset-email');

  authStatus = document.getElementById('auth-status');
  confirmationMessage = document.getElementById('confirmation-message');
  authContainer = document.querySelector('.auth-container');

  // Set up event listeners
  setupEventListeners();

  // Check if user is already logged in
  checkAuthStatus();
});

// Set up event listeners
function setupEventListeners() {
  // Sign In
  signinBtn.addEventListener('click', handleSignIn);
  signinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSignIn();
  });

  // Sign Up
  signupBtn.addEventListener('click', handleSignUp);
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSignUp();
  });

  // Reset Password
  resetBtn.addEventListener('click', handleResetPassword);
  forgotPasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleResetPassword();
  });

  // Navigation links
  document.getElementById('show-signup-link').addEventListener('click', (e) => {
    e.preventDefault();
    showForm('signup');
  });

  document.getElementById('show-signin-link').addEventListener('click', (e) => {
    e.preventDefault();
    showForm('signin');
  });

  document.getElementById('forgot-password-link').addEventListener('click', (e) => {
    e.preventDefault();
    showForm('forgot-password');
  });

  document.getElementById('back-to-signin-link').addEventListener('click', (e) => {
    e.preventDefault();
    showForm('signin');
  });

  backToSigninBtn.addEventListener('click', () => {
    hideConfirmationMessage();
    showForm('signin');
  });

  // Enter key handlers
  signinPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSignIn();
  });

  signupConfirmPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSignUp();
  });

  resetEmail.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleResetPassword();
  });
}

// Check if user is already authenticated
async function checkAuthStatus() {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      // User is logged in, redirect to main popup
      redirectToMainPopup();
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
  }
}

// Show specific form
function showForm(formName) {
  // Hide all forms
  signinForm.classList.remove('active');
  signupForm.classList.remove('active');
  forgotPasswordForm.classList.remove('active');

  // Show requested form
  if (formName === 'signin') {
    signinForm.classList.add('active');
  } else if (formName === 'signup') {
    signupForm.classList.add('active');
  } else if (formName === 'forgot-password') {
    forgotPasswordForm.classList.add('active');
  }

  // Clear status messages
  hideStatus();
}

// Handle Sign In
async function handleSignIn() {
  const email = signinEmail.value.trim();
  const password = signinPassword.value;

  // Validation
  if (!email || !password) {
    showStatus('error', 'Please enter both email and password');
    return;
  }

  if (!isValidEmail(email)) {
    showStatus('error', 'Please enter a valid email address');
    return;
  }

  // Set loading state
  setLoadingState(signinBtn, true);
  hideStatus();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw error;

    // Save session to Chrome storage
    await saveSession(data.session);

    // Show success and redirect
    showStatus('success', 'Signed in successfully! Redirecting...');
    setTimeout(() => redirectToMainPopup(), 1000);

  } catch (error) {
    console.error('Sign in error:', error);
    let errorMessage = 'Failed to sign in. Please check your credentials.';

    if (error.message.includes('Invalid login credentials')) {
      errorMessage = 'Invalid email or password';
    } else if (error.message.includes('Email not confirmed')) {
      errorMessage = 'Please confirm your email before signing in';
    }

    showStatus('error', errorMessage);
    setLoadingState(signinBtn, false);
  }
}

// Handle Sign Up
async function handleSignUp() {
  const email = signupEmail.value.trim();
  const password = signupPassword.value;
  const confirmPassword = signupConfirmPassword.value;

  // Validation
  if (!email || !password || !confirmPassword) {
    showStatus('error', 'Please fill in all fields');
    return;
  }

  if (!isValidEmail(email)) {
    showStatus('error', 'Please enter a valid email address');
    return;
  }

  if (password.length < 6) {
    showStatus('error', 'Password must be at least 6 characters');
    return;
  }

  if (password !== confirmPassword) {
    showStatus('error', 'Passwords do not match');
    return;
  }

  // Set loading state
  setLoadingState(signupBtn, true);
  hideStatus();

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password
    });

    if (error) throw error;

    // Show confirmation message
    showConfirmationMessage();
    setLoadingState(signupBtn, false);

  } catch (error) {
    console.error('Sign up error:', error);
    let errorMessage = 'Failed to create account. Please try again.';

    if (error.message.includes('already registered')) {
      errorMessage = 'This email is already registered';
    }

    showStatus('error', errorMessage);
    setLoadingState(signupBtn, false);
  }
}

// Handle Reset Password
async function handleResetPassword() {
  const email = resetEmail.value.trim();

  // Validation
  if (!email) {
    showStatus('error', 'Please enter your email address');
    return;
  }

  if (!isValidEmail(email)) {
    showStatus('error', 'Please enter a valid email address');
    return;
  }

  // Set loading state
  setLoadingState(resetBtn, true);
  hideStatus();

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: chrome.runtime.getURL('auth.html')
    });

    if (error) throw error;

    showStatus('success', 'Password reset link sent! Check your email.');
    resetEmail.value = '';
    setLoadingState(resetBtn, false);

  } catch (error) {
    console.error('Reset password error:', error);
    showStatus('error', 'Failed to send reset link. Please try again.');
    setLoadingState(resetBtn, false);
  }
}

// Save session to Chrome storage
async function saveSession(session) {
  return new Promise((resolve) => {
    chrome.storage.local.set({
      supabase_session: session,
      supabase_user: session.user
    }, resolve);
  });
}

// Redirect to main popup
function redirectToMainPopup() {
  window.location.href = 'popup.html';
}

// Show confirmation message
function showConfirmationMessage() {
  authContainer.classList.add('showing-confirmation');
  confirmationMessage.classList.remove('hidden');
}

// Hide confirmation message
function hideConfirmationMessage() {
  authContainer.classList.remove('showing-confirmation');
  confirmationMessage.classList.add('hidden');
}

// Show status message
function showStatus(type, message) {
  authStatus.textContent = message;
  authStatus.className = `auth-status ${type}`;
}

// Hide status message
function hideStatus() {
  authStatus.className = 'auth-status hidden';
}

// Set loading state
function setLoadingState(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.classList.add('loading');
  } else {
    button.disabled = false;
    button.classList.remove('loading');
  }
}

// Validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
