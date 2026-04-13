# Admin Panel Setup Guide

## Overview
The admin panel allows administrators to view and manage user statistics including:
- Total number of users
- User scores and performance metrics
- Current level of each user (beginner, intermediate, advanced)
- Registration date and last activity
- Languages attempted
- Number of practice sessions

## Setup Steps

### 1. Configure Admin Email

Add admin email addresses to your `.env` file in the backend folder:

```env
# Admin emails (comma-separated)
ADMIN_EMAILS=admin@example.com,another-admin@example.com
```

### 2. Access the Admin Panel

Once configured:
1. Login with an admin account
2. An "Admin" button will appear in the navbar (red button with shield icon)
3. Click it to access the admin dashboard

### 3. Admin Dashboard Features

#### Dashboard Statistics
- **Total Users**: Shows the total count of registered users
- **Active Today**: Users active in the last 24 hours
- **Active This Week**: Users active in the last 7 days  
- **Average Score**: Average user score across all users
- **Total Sessions**: Total practice sessions completed

#### User Management Table
View detailed information for each user:
- Email address
- User name (if available)
- Total score
- Current level (beginner/intermediate/advanced)
- Number of sessions completed
- Languages attempted
- Join date
- Last activity date

#### Filtering & Sorting
- **Search**: Filter users by email or name
- **Level Filter**: Show users by proficiency level
- **Sort Options**:
  - Highest Score
  - Most Sessions
  - Recently Active
  - Recently Joined

#### Export Data
- Click "Export CSV" to download all user data as a CSV file
- Useful for reports and external analysis

## Backend Endpoints

### Admin Endpoints (Require Admin Role)

#### Get Dashboard Statistics
```
GET /admin/dashboard
Headers: Authorization: Bearer <token>
Response:
{
  "total_users": 10,
  "active_users_today": 3,
  "active_users_week": 7,
  "average_score": 72.5,
  "total_sessions": 45,
  "users": [...]
}
```

#### Get All Users
```
GET /admin/users
Headers: Authorization: Bearer <token>
Response:
{
  "total_users": 10,
  "users": [
    {
      "user_email": "user@example.com",
      "user_name": "John Doe",
      "total_score": 85.5,
      "current_level": "advanced",
      "total_sessions": 15,
      "languages_attempted": "en-US,hi-IN",
      "created_at": "2024-01-15T...",
      "updated_at": "2024-01-20T...",
      "last_activity": "2024-01-20T..."
    }
  ]
}
```

#### Get Summary Stats
```
GET /admin/stats
Headers: Authorization: Bearer <token>
Response:
{
  "total_users": 10,
  "active_users_today": 3,
  "active_users_week": 7,
  "average_score": 72.5,
  "total_sessions": 45
}
```

### User Stats Endpoint

#### Update User Statistics
```
POST /user/stats/update
Headers: Authorization: Bearer <token>
Body:
{
  "accuracy": 85.5,
  "fluency": 80.0,
  "score": 85,
  "language": "en-US",
  "level": "medium",
  "text_length": "medium",
  "duration_seconds": 45.5
}
Response:
{
  "success": true,
  "message": "User statistics updated successfully"
}
```

## Database Models

### UserStats Table
Stores overall user statistics:
- `user_email`: User's email (unique)
- `user_name`: User's display name
- `user_picture`: User's profile picture URL
- `total_score`: Total score accumulated
- `current_level`: beginner/intermediate/advanced
- `total_sessions`: Total practice sessions
- `languages_attempted`: Comma-separated list of languages
- `created_at`: Registration date
- `updated_at`: Last update date
- `last_activity`: Last login/activity date

### SessionHistory Table
Stores individual practice session details:
- `user_email`: User's email (foreign key)
- `language`: Language code (e.g., en-US)
- `level`: Difficulty level (easy/medium/hard)
- `text_length`: Text length (short/medium/long)
- `accuracy`: Pronunciation accuracy (0-100)
- `fluency`: Fluency rating (0-100)
- `score`: Session score
- `duration_seconds`: Session duration
- `created_at`: Session date/time

### AdminUser Table
Stores admin user information (currently not in use):
- `admin_email`: Admin email (unique)
- `is_active`: Whether admin is active
- `created_at`: Creation date

## Level Calculation

User levels are automatically calculated based on average accuracy:
- **Beginner**: Average accuracy < 60%
- **Intermediate**: Average accuracy 60-80%
- **Advanced**: Average accuracy >= 80%

## Important Notes

1. **Admin Access**: User must have their email in the `ADMIN_EMAILS` environment variable to access admin features
2. **Automatic Stats**: User stats are automatically created on first login
3. **Session Tracking**: Each practice session is tracked in the `SessionHistory` table
4. **Real-time Updates**: Statistics update immediately after each practice session
5. **CSV Export**: The exported CSV includes all user data for external analysis

## Troubleshooting

### Cannot see Admin button
- Verify your email is in `ADMIN_EMAILS` in the backend `.env` file
- Try refreshing the page
- Check browser console for errors

### Admin API returns 403
- Your email is not in the `ADMIN_EMAILS` list
- The `ADMIN_EMAILS` variable is not properly set in `.env`

### User stats not updating
- Verify `/user/stats/update` endpoint is called after each session
- Check browser console for API errors
- Ensure ResultPage is properly saving stats (check network tab)

## Future Enhancements

Possible features to add:
- Delete or reset user progress
- Manual score adjustment
- Custom user reports
- User activity logs
- Language-specific statistics
- Performance analytics
- User achievement badges
