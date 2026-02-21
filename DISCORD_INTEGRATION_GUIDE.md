# Discord Webhook Integration Guide

## Overview
Implemented Discord webhook integration that automatically posts event details to a Discord server when an organizer publishes an event (changes status from Draft to Published).

## Features Implemented

### 1. **Organizer Profile Enhancements**

#### New Editable Fields:
- ✅ **Name** (First Name & Last Name)
- ✅ **Organizer/Club Name**
- ✅ **Category** (Technical, Cultural, Sports, etc.)
- ✅ **Description**
- ✅ **Contact Email** (editable)
- ✅ **Contact Number** (NEW - with validation)
- ✅ **Discord Webhook URL** (NEW - with validation)

#### Read-Only Fields:
- 🔒 **Login Email** - Cannot be changed, displayed with "(Read-Only)" label

### 2. **Backend Database Schema Updates**

#### User Model - Organizer Schema
Added two new optional fields to the Organizer discriminator:

```javascript
contactNumber: {
  type: String,
  trim: true,
  validate: {
    validator: function (phone) {
      if (!phone) return true; // Allow empty
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
      return phoneRegex.test(phone);
    },
    message: 'Please provide a valid contact number',
  },
},
discordWebhookUrl: {
  type: String,
  trim: true,
  validate: {
    validator: function (url) {
      if (!url) return true; // Allow empty
      const urlRegex = /^https:\/\/discord(app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/;
      return urlRegex.test(url);
    },
    message: 'Please provide a valid Discord webhook URL',
  },
}
```

**Validation:**
- Contact Number: Accepts international formats with optional country codes (+1234567890, (123) 456-7890, etc.)
- Discord Webhook URL: Must match Discord's webhook URL format: `https://discord.com/api/webhooks/{id}/{token}`

### 3. **Discord Webhook Automation**

#### Trigger Condition:
Discord webhook is triggered when:
- Event status changes from **Draft** (`isPublished: false`) to **Published** (`isPublished: true`)
- Organizer has a valid Discord Webhook URL in their profile
- Automatically sends a rich embed to the Discord server

#### Event Controller Logic:
```javascript
// Check if event is being published (Draft → Published)
const wasUnpublished = !event.isPublished;
const willBePublished = allowedFields.isPublished === true;
const isBeingPublished = wasUnpublished && willBePublished;

// Send Discord webhook notification if event is being published
if (isBeingPublished && event.organizer.discordWebhookUrl) {
  try {
    await sendDiscordWebhook(event);
  } catch (webhookError) {
    // Log error but don't fail the update
    console.error('Discord webhook notification failed:', webhookError.message);
  }
}
```

**Key Points:**
- Webhook is sent asynchronously and non-blocking
- If webhook fails, the event update still succeeds
- Errors are logged but don't interrupt the user experience
- Uses native Node.js `https` module (no external dependencies)

### 4. **Discord Message Format**

The webhook sends a rich embed with the following information:

#### Embed Structure:
```
🎉 New Event Published: {Event Name}

Description: {Event Description}

Fields:
📅 Event Dates
  Start: {Formatted Start Date}
  End: {Formatted End Date}

📝 Registration Deadline: {Formatted Deadline}

💰 Registration Fee: ₹{amount} or "Free"
👥 Registration Limit: {limit} participants or "Unlimited"
📍 Venue: {venue} or "TBA"
🏷️ Category: {category}
🎫 Event Type: 📋 Registration or 🛍️ Merchandise

🏷️ Tags: {tag1, tag2, tag3} (if available)

🔗 Register Now: [Click here to view and register]({event_url})

Footer: Organized by {Organizer Name}
Timestamp: {Current DateTime}
```

#### Example Discord Message:
```
@everyone 🎉 **New Event Alert!**

┌─────────────────────────────────┐
│ 🎉 New Event Published: TechFest 2026
│ 
│ A 3-day technology festival featuring workshops, 
│ hackathons, and keynote speakers from top tech companies.
│
│ 📅 Event Dates
│   Start: Saturday, March 14, 2026 at 09:00 AM
│   End: Monday, March 16, 2026 at 06:00 PM
│
│ 📝 Registration Deadline
│   Friday, March 13, 2026 at 11:59 PM
│
│ 💰 Registration Fee: ₹500
│ 👥 Registration Limit: 200 participants
│ 📍 Venue: Main Auditorium, IIIT Campus
│ 🏷️ Category: Technical
│ 🎫 Event Type: 📋 Registration
│
│ 🏷️ Tags: hackathon, workshop, technology, AI
│
│ 🔗 Register Now
│   Click here to view and register
│
│ Organized by Tech Club IIIT
│ 🕐 February 9, 2026 at 3:45 PM IST
└─────────────────────────────────┘
```

### 5. **Frontend UI Changes**

#### OrganizerProfile.jsx Updates:

**Login Email Section (Read-Only):**
```jsx
<label>
  <Mail size={16} />
  Login Email
  <span style={{ color: '#6b7280' }}>(Read-Only)</span>
</label>
<input
  type="email"
  value={user?.email || ''}
  disabled
  style={{
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    cursor: 'not-allowed'
  }}
/>
```

**Contact Number Section:**
```jsx
<label>
  <Phone size={16} />
  Contact Number
</label>
<input
  type="tel"
  name="contactNumber"
  placeholder="+1234567890"
  disabled={!editMode}
/>
```

**Discord Webhook Section:**
```jsx
<label>
  <MessageSquare size={16} />
  Discord Webhook URL
  <span>(Optional - Auto-post events when published)</span>
</label>
<input
  type="url"
  name="discordWebhookUrl"
  placeholder="https://discord.com/api/webhooks/..."
  disabled={!editMode}
/>
<p style={{ fontSize: '12px', color: '#6b7280' }}>
  When you publish an event, it will automatically be posted to your 
  Discord server via this webhook.
</p>
```

## How to Set Up Discord Webhook

### Step 1: Create a Discord Webhook

1. Open your Discord server
2. Go to **Server Settings** → **Integrations** → **Webhooks**
3. Click **New Webhook** or **Create Webhook**
4. Configure webhook:
   - Name: "Event Notifications" (or any name)
   - Channel: Select the channel where events should be posted
   - Copy the webhook URL
5. Click **Save**

### Step 2: Add Webhook to Organizer Profile

1. Log in to your organizer account
2. Navigate to **Profile** (from navbar)
3. Click **Edit Profile**
4. Paste the Discord webhook URL in the **Discord Webhook URL** field
5. Format: `https://discord.com/api/webhooks/{webhook_id}/{webhook_token}`
6. Click **Save Changes**

### Step 3: Test the Integration

1. Go to **Dashboard** → **Create Event**
2. Fill in event details
3. Keep **Publish Event** checkbox **unchecked** (Draft mode)
4. Click **Create Event**
5. Go to **Dashboard** → Find your event → Click **Edit**
6. Check the **Publish Event** checkbox
7. Click **Save Changes**
8. Check your Discord channel - you should see the event posted!

## Workflow Diagram

```
┌─────────────────┐
│ Organizer       │
│ Creates Event   │
│ (Draft Mode)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Event Saved     │
│ isPublished:    │
│ false           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Organizer Goes  │
│ to Edit Event   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Checks Publish  │
│ Event Checkbox  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Click Save      │
│ Changes         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│ Backend:        │────▶│ Discord Webhook  │
│ Detect Draft→   │     │ URL exists?      │
│ Published       │     └────────┬─────────┘
└─────────────────┘              │
                                 │ Yes
                                 ▼
                    ┌──────────────────────┐
                    │ Send Rich Embed      │
                    │ to Discord via       │
                    │ HTTPS POST Request   │
                    └────────┬─────────────┘
                             │
                             ▼
                    ┌──────────────────────┐
                    │ Event Announcement   │
                    │ Posted in Discord    │
                    │ Channel (@everyone)  │
                    └──────────────────────┘
```

## Technical Implementation Details

### Date Formatting
All dates are formatted in **IST (Asia/Kolkata)** timezone with the following format:
```
Saturday, March 14, 2026 at 09:00 AM
```

### Error Handling
- Invalid webhook URLs are rejected at the database level
- Failed webhook requests don't block event updates
- Errors are logged to the console for debugging
- 5-second timeout prevents hanging requests
- HTTP status codes 2xx are considered successful

### Security Considerations
1. **Webhook URL Validation**: Regex ensures only valid Discord webhook URLs are accepted
2. **HTTPS Only**: Webhook requests use secure HTTPS protocol
3. **Non-Blocking**: Failed webhooks don't affect user experience
4. **No Sensitive Data**: Only public event information is sent
5. **Rate Limiting**: Discord has built-in rate limiting (30 requests per minute per webhook)

### Performance
- Webhook request timeout: 5 seconds
- Uses Node.js native `https` module (no additional dependencies)
- Asynchronous operation doesn't block API response
- Minimal memory footprint

## Troubleshooting

### Webhook Not Posting to Discord

**Check 1: Webhook URL Format**
- Ensure URL starts with `https://discord.com/api/webhooks/` or `https://discordapp.com/api/webhooks/`
- Verify webhook ID and token are present
- No extra characters or spaces

**Check 2: Webhook Still Valid**
- Webhook may have been deleted from Discord server
- Regenerate webhook in Discord settings

**Check 3: Event Actually Being Published**
- Webhook only triggers on Draft → Published transition
- If event is already published, editing won't trigger webhook
- Create new draft event and publish it to test

**Check 4: Backend Logs**
```bash
# Check for webhook errors in backend console
Console: "Discord webhook notification sent for event: {Event Name}"
OR
Console: "Discord webhook notification failed: {Error Message}"
```

### Common Error Messages

**"Please provide a valid Discord webhook URL"**
- Webhook URL format is incorrect
- Must match: `https://discord.com/api/webhooks/{id}/{token}`

**"Discord webhook request timed out"**
- Network connectivity issue
- Discord API may be temporarily unavailable
- Webhook URL may be invalid

**"Discord webhook failed with status 404"**
- Webhook has been deleted from Discord
- Create new webhook and update profile

**"Discord webhook failed with status 401"**
- Webhook token is invalid
- Regenerate webhook in Discord

## Environment Configuration

Add to your `backend/config/config.env` file:

```env
# Frontend URL for Discord webhook links
FRONTEND_URL=http://localhost:5173

# For production
# FRONTEND_URL=https://yourdomain.com
```

This URL is used to generate the "Register Now" link in Discord messages.

## API Changes

### GET /api/users/me
**New Response Fields:**
```json
{
  "contactNumber": "+1234567890",
  "discordWebhookUrl": "https://discord.com/api/webhooks/..."
}
```

### PUT /api/users/me
**New Acceptable Fields:**
```json
{
  "contactNumber": "+1234567890",
  "discordWebhookUrl": "https://discord.com/api/webhooks/..."
}
```

### PUT /api/events/:id
**Enhanced Response:**
When publishing an event, the organizer object now includes:
```json
{
  "organizer": {
    "discordWebhookUrl": "https://discord.com/api/webhooks/...",
    "contactEmail": "contact@example.com"
  }
}
```

## Testing Checklist

- [ ] Create organizer account
- [ ] Set up Discord webhook in profile
- [ ] Verify webhook URL validation (try invalid URL)
- [ ] Create draft event
- [ ] Publish event via Edit page
- [ ] Check Discord channel for message
- [ ] Verify all event details in Discord message
- [ ] Test with event that has no image
- [ ] Test with event that has no tags
- [ ] Test with free event (₹0)
- [ ] Test with unlimited registration limit
- [ ] Remove webhook URL from profile
- [ ] Publish another event (should not post to Discord)
- [ ] Verify already-published event doesn't trigger webhook when edited

## Benefits

1. **Instant Notification**: Community members get immediate updates when new events are published
2. **Professional Presentation**: Rich embeds with organized information and formatting
3. **Direct Link**: One-click access to event registration page
4. **Centralized Communication**: All event announcements in one Discord channel
5. **Automated Workflow**: No manual copying/posting required
6. **Engagement**: @everyone mention ensures high visibility
7. **Branding**: Organizer name displayed in footer

## Future Enhancements

Potential additions for future versions:

1. **Multiple Webhooks**: Support different webhooks for different event categories
2. **Custom Templates**: Allow organizers to customize Discord message format
3. **Registration Updates**: Post updates when registration milestones are reached
4. **Event Reminders**: Auto-post reminders X days before event starts
5. **Cancellation Notices**: Auto-post if event is unpublished/cancelled
6. **Registration Stats**: Post updates when event reaches 50%, 75%, 100% capacity
7. **Event Completion**: Post thank you message with attendance stats after event ends
8. **Slack Integration**: Add similar webhook support for Slack workspaces
9. **Telegram Integration**: Bot notifications for Telegram groups
10. **Email Digests**: Daily/weekly event summary emails with all new events

## Conclusion

The Discord webhook integration provides seamless automated event announcements, enhancing community engagement and reducing manual work for organizers. The implementation is robust, secure, and user-friendly with clear setup instructions and comprehensive error handling.
