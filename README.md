# Clay Enrichment Chrome Extension

> Enterprise-grade Chrome extension for real-time lead enrichment and account research using Clay API integration with advanced analytics tracking and user authentication.

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chrome.google.com/webstore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-blue.svg)](https://supabase.com)
[![Clay API](https://img.shields.io/badge/Clay-API-orange.svg)](https://clay.com)

## Overview

A production-ready Chrome extension that captures URLs from active browser tabs and enriches them with comprehensive business intelligence data through Clay's automation platform. Features real-time data synchronization, multi-workflow support, user authentication, and persistent search history.

## Key Features

### Core Functionality
- **Real-time URL Capture**: Automatically detects and displays the current active tab URL
- **Multi-Workflow Support**: Three distinct enrichment workflows
  - Contact Information Extraction
  - Account Research & Intelligence
  - Lead Research & Qualification
- **Clay API Integration**: Direct webhook integration with Clay's data enrichment platform
- **Real-time Data Sync**: Supabase Realtime for instant enriched data delivery
- **Persistent Search History**: Workflow-specific history with expandable results
- **Bulk History Management**: Clear all history per workflow with confirmation

### Authentication & Security
- **Supabase Authentication**: Enterprise-grade auth backend
- **Email/Password Authentication**: Traditional login with email verification
- **Google OAuth 2.0**: Single sign-on with Google accounts
- **Chrome Identity API**: Seamless OAuth flow for extensions
- **Session Persistence**: Secure session storage in Chrome's local storage
- **Password Reset**: Email-based password recovery
- **Protected Routes**: Authentication guards on all pages

### User Experience
- **Custom Dropdown UI**: Polished custom select components
- **Loading States**: Visual feedback during API calls
- **Error Handling**: Comprehensive error messages and retry mechanisms
- **Responsive Design**: Optimized for extension popup dimensions
- **User Profile Dropdown**: Easy access to account info and sign-out
- **Email Verification Flow**: Secure account activation process

### Data Management
- **Supabase PostgreSQL**: Scalable cloud database
- **Separate Tables**: Isolated data storage per workflow
- **Request Tracking**: Unique request IDs for data correlation
- **User Association**: All data linked to authenticated users
- **Automatic Cleanup**: History management capabilities

## Tech Stack

### Frontend Technologies
- **HTML5**: Semantic markup and modern web standards
- **CSS3**: Custom styling with Google Fonts (DM Sans)
- **Vanilla JavaScript**: No framework dependencies for lightweight performance
- **Chrome Extensions API**: Manifest V3 compliance
  - `chrome.tabs` - Active tab management
  - `chrome.storage.local` - Secure local storage
  - `chrome.identity` - OAuth integration

### Backend & Database
- **Supabase**: Backend-as-a-Service platform
  - **PostgreSQL**: Relational database
  - **Realtime**: WebSocket-based live data updates
  - **Auth**: Complete authentication system
  - **Row Level Security**: Data access policies
- **Clay API**: Data enrichment webhooks
- **RESTful Architecture**: HTTP-based webhook communication

### Development Tools
- **Git**: Version control
- **npm**: Package management
- **Express.js**: Local development server (optional)
- **CORS**: Cross-origin resource sharing

Note: Pubilc facing version - the one in production is hidden :)
