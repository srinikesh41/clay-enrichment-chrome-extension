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

### Analytics & Tracking (Integrated)
- **Google Tag Manager (GTM)**: Tag management system
- **Google Analytics 4 (GA4)**: Advanced analytics and user behavior tracking
- **DataLayer Implementation**: Structured event tracking
- **Custom Event Tracking**:
  - Workflow selections
  - Enrichment requests/responses
  - Authentication events
  - User engagement metrics
  - Error tracking
  - Performance monitoring

### Recommended GTM Tools & Extensions
Based on industry best practices for 2026:

#### Debugging & Development
- **GTM/GA Debugger**: DataLayer and GA4 request inspection
- **TagHound**: Multi-platform analytics debugger (22+ platforms)
- **DataLayer Checker**: DataLayer validation without console
- **Omnibug**: Decodes outgoing marketing tool requests
- **Adswerve's Data Layer Inspector**: Container injection and debugging
- **Tag Assistant (Google)**: Official Google tag troubleshooting

#### Quality Assurance
- **WASP.Inspector**: Web analytics quality assurance
- **Meta Pixel Helper**: Facebook pixel debugging
- **Tag Chef**: 180+ pretested GTM tracking setups

### Chrome Extension Permissions
```json
{
  "permissions": [
    "activeTab",    // Read current tab URL
    "storage",      // Store user data locally
    "identity"      // OAuth authentication
  ],
  "host_permissions": [
    "<all_urls>"    // Access to all URLs for enrichment
  ]
}
```

## Architecture

### Data Flow
1. **URL Capture**: Extension reads active tab URL via Chrome API
2. **Workflow Selection**: User chooses enrichment type
3. **Webhook Request**: POST to Clay API with payload
4. **Clay Processing**: Clay enriches data using multiple sources
5. **Database Insert**: Clay writes to Supabase table
6. **Realtime Sync**: Supabase broadcasts insert event
7. **UI Update**: Extension receives and displays enriched data

### Database Schema
```
enriched_data (Contact Info)
├── id (uuid)
├── request_id (text)
├── url (text)
├── name (text)
├── title (text)
├── org (text)
├── country (text)
├── work_email (text)
├── user_id (uuid, FK)
├── user_email (text)
└── created_at (timestamp)

account_research_data (Account Research)
├── [same structure with research-specific fields]

lead_research_data (Lead Research)
├── [same structure with lead-specific fields]
```

### Authentication Flow
1. **Sign Up**: Email/password or Google OAuth
2. **Email Verification**: Confirmation link sent
3. **Session Creation**: Supabase generates JWT
4. **Storage**: Session saved to Chrome local storage
5. **Auto-restore**: Session retrieved on popup open
6. **Protected Access**: Redirect to auth if no session

## Installation

### Prerequisites
- Chrome browser (v88+)
- Supabase account
- Clay account with webhook access

### Setup Steps

1. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/clay-enrichment-chrome-extension.git
   cd clay-enrichment-chrome-extension
   ```

2. **Configure Supabase**
   - Create new Supabase project
   - Create tables using schema above
   - Enable Realtime on all tables
   - Configure email authentication
   - Set up Google OAuth provider
   - Update `SUPABASE_URL` and `SUPABASE_ANON_KEY` in code

3. **Configure Clay Webhooks**
   - Create three webhook receivers in Clay
   - Update `CLAY_WEBHOOK_URLS` in `popup.js`

4. **Load Extension**
   - Open Chrome → Extensions (`chrome://extensions/`)
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select extension directory

5. **Configure GTM (Optional)**
   - Create GTM container
   - Add GA4 property
   - Update `GTM_ID` and `GA4_ID` in analytics configuration
   - Deploy container

## Usage

### First Time Setup
1. Click extension icon in Chrome toolbar
2. Sign up with email or Google account
3. Verify email (if using email/password)
4. Redirected to main extension popup

### Enriching Data
1. Navigate to target webpage (LinkedIn, company site, etc.)
2. Click extension icon
3. Select workflow from dropdown
4. Click "Send to Clay"
5. Wait for enriched data (typically 10-60 seconds)
6. View results in popup

### Managing History
- History automatically loads per workflow
- Click history item to expand/collapse details
- Click "Clear All" to remove all workflow history
- Switch workflows to see different histories

## Configuration

### Environment Variables
Update these values in respective files:

**popup.js**
```javascript
const CLAY_WEBHOOK_URLS = {
  'get_contact_info': 'YOUR_CLAY_WEBHOOK_URL',
  'do_account_research': 'YOUR_CLAY_WEBHOOK_URL',
  'do_lead_research': 'YOUR_CLAY_WEBHOOK_URL'
};

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

**auth.js**
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

### Customization Options
- **Request Timeout**: Modify `REQUEST_TIMEOUT` (default: 120000ms)
- **Display Fields**: Edit `DISPLAY_FIELDS` array for different data fields
- **History Limit**: Adjust `.limit(50)` in `loadSearchHistory()`
- **Styling**: Update `popup.css` and `auth.css` for custom branding

## API Reference

### Clay Webhook Payload
```javascript
{
  "url": "https://example.com",
  "workflow": "get_contact_info",
  "requestId": "1234567890",
  "timestamp": "2026-01-17T10:30:00.000Z",
  "user_id": "uuid-here",
  "user_email": "user@example.com"
}
```

### Supabase Realtime Subscription
```javascript
supabase
  .channel('enriched-data-{requestId}')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'enriched_data'
  }, callback)
  .subscribe()
```

## Analytics Events

### Tracked Events
- `page_view`: Page/popup opened
- `workflow_selected`: User chooses workflow
- `enrichment_request`: Data sent to Clay
- `enrichment_success`: Data received successfully
- `enrichment_error`: Request failed
- `authentication`: Sign in/up/out events
- `history_action`: History interactions
- `button_click`: All button interactions
- `form_submission`: Form events
- `user_engagement`: Time spent in extension
- `error_occurred`: Error tracking
- `performance_metric`: Performance monitoring

### User Properties
- `user_id`: Unique user identifier
- `user_email`: User email address
- `login_method`: 'email' or 'google'

## Performance Optimizations

- **Lightweight Bundle**: No heavy frameworks (<100KB total)
- **Lazy Loading**: Scripts loaded on-demand
- **Efficient DOM Updates**: Minimal reflows and repaints
- **Request Debouncing**: Prevents duplicate API calls
- **Local Caching**: Session persistence reduces auth calls
- **Indexed Queries**: Database optimized with proper indexes

## Security Features

- **JWT Authentication**: Secure token-based auth
- **HTTPS Only**: All API calls over SSL
- **Input Validation**: Email regex and password requirements
- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Chrome extension isolated environment
- **Rate Limiting**: Supabase built-in rate limits
- **Row Level Security**: Database-level access control

## Error Handling

### User-Facing Errors
- Invalid credentials
- Network failures
- Timeout errors (2-minute limit)
- Email verification required
- Rate limit exceeded

### Developer Errors
- Missing configuration
- Invalid webhook URLs
- Supabase connection failures
- Malformed data responses

## Browser Compatibility

- **Chrome**: v88+ (Manifest V3)
- **Edge**: v88+ (Chromium-based)
- **Brave**: v1.20+
- **Opera**: v74+

## Roadmap

### Planned Features
- [ ] Advanced filtering and search in history
- [ ] Export enriched data to CSV/JSON
- [ ] Batch URL processing
- [ ] Custom webhook configuration UI
- [ ] Dark mode theme
- [ ] Keyboard shortcuts
- [ ] Offline mode with queue
- [ ] Advanced analytics dashboard
- [ ] A/B testing capabilities
- [ ] Multi-language support

### Future Integrations
- [ ] HubSpot CRM sync
- [ ] Salesforce integration
- [ ] Zapier native connector
- [ ] Slack notifications
- [ ] Microsoft Teams integration

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Add comments for complex logic
- Test all authentication flows
- Verify Realtime subscriptions
- Update documentation

## Troubleshooting

### Common Issues

**Extension not loading**
- Check manifest.json syntax
- Verify all file paths are correct
- Reload extension in chrome://extensions

**Authentication fails**
- Verify Supabase URL and keys
- Check email confirmation
- Clear Chrome storage and retry

**No enriched data received**
- Verify Clay webhook URLs
- Check Supabase table names match code
- Enable Realtime on tables
- Check browser console for errors

**History not loading**
- Ensure workflow selected
- Check Supabase table permissions
- Verify user authentication

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Supabase**: For the amazing backend platform
- **Clay**: For the powerful data enrichment API
- **Google Fonts**: For the DM Sans typeface
- **Chrome Extensions Team**: For comprehensive documentation

## Contact & Support

- **Developer**: Your Name
- **Email**: your.email@example.com
- **GitHub**: [@yourusername](https://github.com/yourusername)
- **Issues**: [GitHub Issues](https://github.com/yourusername/clay-enrichment-chrome-extension/issues)

## Changelog

### v1.1.0 (Current)
- Added extension key for consistent ID
- Improved authentication UI
- Fixed scrollbar styling
- Enhanced error messages
- Added email verification page

### v1.0.0
- Initial release
- Core enrichment functionality
- Supabase authentication
- Search history feature
- Real-time data sync

---

**Built with ❤️ for sales and marketing teams**

*Streamlining lead enrichment, one URL at a time.*
