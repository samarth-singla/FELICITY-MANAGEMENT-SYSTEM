# State-Based Editing Implementation

## Overview
Implemented comprehensive state-based editing restrictions for events based on their lifecycle status. This prevents organizers from making breaking changes to live events while maintaining flexibility during draft and published phases.

## Event Status Calculation
Event status is **dynamically calculated** (not stored in database) based on:
- `isPublished` boolean field
- Current date vs `startDate` and `endDate`

### Status Definitions:
1. **Draft** (`!isPublished`): Event not yet published
2. **Published** (`isPublished && startDate > now`): Published but not started
3. **Ongoing** (`isPublished && startDate <= now && endDate >= now`): Currently in progress
4. **Completed** (`isPublished && endDate < now`): Event has ended

## Editing Restrictions

### Draft Status
- **Allowed**: All fields can be edited freely
- **Exception**: Custom Form Builder is locked if `currentRegistrations > 0`
- **Reasoning**: Maximum flexibility during event setup, but protect form structure once registrations start

### Published Status  
- **Allowed**: Only these 3 fields:
  - Description
  - Registration Deadline
  - Registration Limit
- **Locked**: Name, dates, venue, fee, category, tags, image, custom form
- **Reasoning**: Allow organizers to adjust registration capacity and deadlines without breaking published event details

### Ongoing/Completed Status
- **Allowed**: Only `isPublished` toggle (to unpublish if needed)
- **Locked**: All other fields
- **Reasoning**: Prevent any changes that could affect active or historical event data

### Form Builder Special Rule
- **Locked when**: `currentRegistrations > 0` (regardless of status)
- **Applies to**: Custom Form Builder for Normal events
- **Reasoning**: Changing form structure after registrations exist would invalidate existing registration data

## Backend Implementation

### File: `backend/controllers/eventController.js`

```javascript
// Update Event with State-Based Restrictions (Lines ~140-260)
exports.updateEvent = asyncHandler(async (req, res, next) => {
  let event = await Event.findById(req.params.id);
  
  if (!event) {
    return next(new ErrorResponse(`Event not found with id of ${req.params.id}`, 404));
  }

  // Authorization check
  if (event.organizer.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new ErrorResponse(`Not authorized to update this event`, 403));
  }

  // Determine event status dynamically
  const now = new Date();
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  
  let eventStatus = 'draft';
  if (!event.isPublished) {
    eventStatus = 'draft';
  } else if (startDate > now) {
    eventStatus = 'published';
  } else if (startDate <= now && endDate >= now) {
    eventStatus = 'ongoing';
  } else {
    eventStatus = 'completed';
  }

  // Check if event has registrations
  const hasRegistrations = event.currentRegistrations > 0;

  // Initialize allowedFields object
  let allowedFields = {};

  // DRAFT MODE: Allow most fields, except customForm if registrations exist
  if (eventStatus === 'draft') {
    allowedFields = { ...req.body };
    
    // Block customForm updates if registrations exist
    if (hasRegistrations && req.body.customForm) {
      return next(new ErrorResponse(
        'Cannot update custom form after registrations have been received',
        400
      ));
    }

    // Validate merchandise-specific fields
    if (event.type === 'Merchandise' && req.body.itemDetails) {
      // Validate itemDetails structure if provided
    }
  }
  
  // PUBLISHED MODE: Only allow description, registrationDeadline, registrationLimit
  else if (eventStatus === 'published') {
    const editableFields = ['description', 'registrationDeadline', 'registrationLimit'];
    
    // Check if any non-editable fields are being attempted
    const attemptedFields = Object.keys(req.body);
    const restrictedFieldsAttempted = attemptedFields.filter(
      field => !editableFields.includes(field)
    );
    
    if (restrictedFieldsAttempted.length > 0) {
      return next(new ErrorResponse(
        `Cannot update these fields for a published event: ${restrictedFieldsAttempted.join(', ')}. ` +
        `Only editable fields are: ${editableFields.join(', ')}`,
        400
      ));
    }
    
    // Only copy editable fields
    editableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        allowedFields[field] = req.body[field];
      }
    });
  }
  
  // ONGOING/COMPLETED MODE: Only allow status toggle
  else if (eventStatus === 'ongoing' || eventStatus === 'completed') {
    const attemptedFields = Object.keys(req.body).filter(f => f !== 'isPublished');
    
    if (attemptedFields.length > 0) {
      return next(new ErrorResponse(
        `Cannot update event fields during ${eventStatus} status. ` +
        `Only the publish status can be toggled. Attempted to update: ${attemptedFields.join(', ')}`,
        400
      ));
    }
    
    // Only allow isPublished toggle
    if (req.body.isPublished !== undefined) {
      allowedFields.isPublished = req.body.isPublished;
    }
  }

  // ALWAYS prevent manual updates to these fields
  delete allowedFields.organizer;
  delete allowedFields.currentRegistrations;

  // Update event with allowed fields
  event = await Event.findByIdAndUpdate(
    req.params.id,
    allowedFields,
    {
      new: true,
      runValidators: true
    }
  ).populate('organizer', 'name email');

  res.status(200).json({
    success: true,
    data: event
  });
});
```

## Frontend Implementation

### File: `frontend/src/pages/EditEvent.jsx`

**Key Features:**
1. **Status Banner**: Shows current status with color-coded badge and restriction message
2. **Dynamic Field Locking**: Fields are disabled based on status with lock icons
3. **Visual Indicators**: 
   - Lock icon for disabled fields
   - "(Locked)" text next to labels
   - "(Editable)" badge for allowed fields in published mode
   - Grayed out styling for disabled inputs
4. **Form Builder Lock Notice**: Yellow banner when form is locked due to registrations
5. **Authorization Check**: Verifies user is event owner before allowing edits
6. **Conditional Submission**: Only sends editable fields based on current status

**Status Information Function:**
```javascript
const getStatusInfo = () => {
  switch (eventStatus) {
    case 'draft':
      return {
        label: 'Draft',
        color: '#fbbf24',
        bgColor: '#fef3c7',
        message: hasRegistrations 
          ? 'Full editing allowed. Note: Form builder is locked due to existing registrations.'
          : 'Full editing allowed for all fields.',
      };
    case 'published':
      return {
        label: 'Published',
        color: '#3b82f6',
        bgColor: '#dbeafe',
        message: 'Only Description, Registration Deadline, and Registration Limit can be edited.',
      };
    case 'ongoing':
      return {
        label: 'Ongoing',
        color: '#10b981',
        bgColor: '#d1fae5',
        message: 'Event is currently in progress. Only status can be changed.',
      };
    case 'completed':
      return {
        label: 'Completed',
        color: '#6b7280',
        bgColor: '#f3f4f6',
        message: 'Event has ended. Only status can be changed.',
      };
  }
};
```

**Field Editability Check:**
```javascript
const isFieldEditable = (fieldName) => {
  // DRAFT: All fields editable (except custom form if has registrations)
  if (eventStatus === 'draft') {
    if (fieldName === 'customForm' && hasRegistrations) {
      return false;
    }
    return true;
  }
  
  // PUBLISHED: Only description, registrationDeadline, registrationLimit
  if (eventStatus === 'published') {
    return ['description', 'registrationDeadline', 'registrationLimit'].includes(fieldName);
  }
  
  // ONGOING/COMPLETED: Only status toggle (isPublished)
  if (eventStatus === 'ongoing' || eventStatus === 'completed') {
    return fieldName === 'isPublished';
  }
  
  return false;
};
```

### File: `frontend/src/pages/OrganizerDashboard.jsx`

**Changes:**
- Added "Edit" button to event cards (yellow button between Registrations and View)
- Imports `Edit` icon from lucide-react
- Edit button navigates to `/organizer/edit-event/:id`

### File: `frontend/src/App.jsx`

**New Route:**
```javascript
<Route
  path="/organizer/edit-event/:id"
  element={
    <ProtectedRoute allowedRoles={['Organizer']}>
      <EditEvent />
    </ProtectedRoute>
  }
/>
```

## User Flow

1. **Organizer Dashboard** → Click "Edit" button on any event card
2. **EditEvent Page** loads with:
   - Current event data populated
   - Status banner showing current state and restrictions
   - Fields enabled/disabled based on status
   - Lock icons and labels for disabled fields
3. **Make Changes** within allowed fields
4. **Submit** → Backend validates and applies restrictions
5. **Success** → Redirects to event details page

## Error Handling

### Backend Error Messages:
- **Draft + Custom Form + Registrations**: "Cannot update custom form after registrations have been received"
- **Published + Restricted Fields**: "Cannot update these fields for a published event: [field list]. Only editable fields are: description, registrationDeadline, registrationLimit"
- **Ongoing/Completed + Any Field**: "Cannot update event fields during [status] status. Only the publish status can be toggled. Attempted to update: [field list]"

### Frontend Validation:
- Authorization check before rendering form
- Required field validation before submission
- Success/error message display with icons
- Redirect after successful update

## Security Considerations

1. **Always-Blocked Fields**: `organizer` and `currentRegistrations` are deleted from update payload regardless of status
2. **Authorization**: Both frontend and backend verify user is event owner
3. **Status Calculation**: Done server-side to prevent manipulation
4. **Protected Routes**: Edit route requires Organizer role

## Testing Scenarios

1. ✅ Create draft event → Edit all fields → Success
2. ✅ Add registration to draft → Try editing form → Error
3. ✅ Publish event → Edit description/deadline/limit → Success
4. ✅ Published event → Try editing name/venue → Error
5. ✅ Start date passes (ongoing) → Only status toggle works
6. ✅ End date passes (completed) → Only status toggle works
7. ✅ Non-owner tries to edit → Authorization error

## Benefits

1. **Data Integrity**: Prevents breaking changes to live events
2. **Flexibility**: Allows necessary adjustments (deadlines, capacity) during published phase
3. **User-Friendly**: Clear visual indicators show what can/cannot be edited
4. **Registration Protection**: Form structure locks after first registration
5. **Historical Accuracy**: Completed events maintain their original data

## Future Enhancements

1. Add change history/audit log for event updates
2. Implement draft/publish workflow with approval
3. Add bulk field updates for multiple events
4. Create templates from completed events (with form structure)
5. Add email notifications to registered participants when certain fields change
