# API Payload Documentation for Thunder Client

This document lists all the routes we implemented and modified, using the correct local base URL: `http://localhost:3000/api/v1`.

## Common Setup

### Required Headers
For all authenticated endpoints below, include these headers:
*   `Authorization`: `Bearer <YOUR_JWT_ACCESS_TOKEN>`
*   `Content-Type`: `application/json`

---

## 0. Authentication APIs (Public / Private)

### User / Creator Registration
*   **Method:** `POST`
*   **URL:** `http://localhost:3000/api/v1/auth/register`
*   **Body (JSON):**
    ```json
    {
      "email": "tester@example.com",
      "username": "tester123",
      "password": "Password123",
      "role": "USER"
    }
    ```
    *   `role` must be either `"USER"` or `"CREATOR"`.
    *   `password` must be at least 8 characters long.
    *   `username` must be between 3 and 30 characters.
*   **Example Response:**
    ```json
    {
      "user": {
        "id": "user-id-uuid",
        "email": "tester@example.com",
        "username": "tester123",
        "role": "USER",
        "isVerified": false,
        "createdAt": "2026-06-17T12:00:00.000Z"
      },
      "tokens": {
        "access": {
          "token": "accessTokenString",
          "expires": "2026-06-18T12:00:00.000Z"
        },
        "refresh": {
          "token": "refreshTokenString",
          "expires": "2026-06-24T12:00:00.000Z"
        }
      }
    }
    ```

### User Login
*   **Method:** `POST`
*   **URL:** `http://localhost:3000/api/v1/auth/login`
*   **Body (JSON):**
    ```json
    {
      "email": "tester@example.com",
      "password": "Password123"
    }
    ```
*   **Example Response:** Returns same payload as Registration, containing the `"tokens"` object with the access token needed for subsequent requests.

### Get Current User Profile (Auth Check)
*   **Method:** `GET`
*   **URL:** `http://localhost:3000/api/v1/auth/me`
*   **Headers:** Requires `Authorization: Bearer <access_token>`
*   **Body:** None

### Refresh Tokens
*   **Method:** `POST`
*   **URL:** `http://localhost:3000/api/v1/auth/refresh`
*   **Body (JSON):**
    ```json
    {
      "refreshToken": "refreshTokenStringHere"
    }
    ```

### Logout
*   **Method:** `POST`
*   **URL:** `http://localhost:3000/api/v1/auth/logout`
*   **Body (JSON):**
    ```json
    {
      "refreshToken": "refreshTokenStringHere"
    }
    ```

### Change Password
*   **Method:** `PATCH`
*   **URL:** `http://localhost:3000/api/v1/auth/change-password`
*   **Headers:** Requires `Authorization: Bearer <access_token>`
*   **Body (JSON):**
    ```json
    {
      "oldPassword": "Password123",
      "newPassword": "NewPassword123"
    }
    ```

---

## 1. User Dashboard, Subscriptions & Favorites

### Get User Dashboard
*   **Method:** `GET`
*   **URL:** `http://localhost:3000/api/v1/users/dashboard`
*   **Body:** None
*   **Example Response:**
    ```json
    {
      "user": {
        "id": "subscriber-id-uuid",
        "username": "johndoe",
        "role": "USER"
      },
      "stats": {
        "activeSubscriptions": 2,
        "bookmarkedPosts": 4,
        "spentThisMonth": 19.98
      },
      "activeSubscriptions": [
        {
          "id": "sub-id-uuid-1",
          "creatorId": "creator-id-uuid-1",
          "username": "marcus_fit",
          "price": 9.99,
          "avatarUrl": "https://picsum.photos/seed/avatar1/150"
        }
      ],
      "recentPosts": [
        {
          "id": "post-id-uuid",
          "content": "New intense full-body session just dropped. Push your limits with me today. 💪🔥",
          "visibility": "PUBLIC",
          "creator": {
            "id": "creator-id-uuid-1",
            "username": "marcus_fit"
          },
          "media": [
            {
              "id": "media-uuid",
              "type": "IMAGE",
              "url": "https://cloudfront.net/signed-url/fitness-image.webp"
            }
          ],
          "isLocked": false
        }
      ],
      "suggestedCreators": [
        {
          "id": "creator-id-uuid-2",
          "username": "julian_x",
          "bio": "Behind the scenes access to modeling work",
          "price": 14.99,
          "avatarUrl": "https://picsum.photos/seed/avatar2/150",
          "coverUrl": "https://picsum.photos/seed/cover2/600/200"
        }
      ]
    }
    ```

### Get Active Subscriptions List
*   **Method:** `GET`
*   **URL:** `http://localhost:3000/api/v1/users/subscriptions`
*   **Body:** None

### Cancel Creator Subscription
*   **Method:** `POST`
*   **URL:** `http://localhost:3000/api/v1/users/subscriptions/{{subscriptionId}}/cancel`
    *   *Replace `{{subscriptionId}}` with the subscription UUID in your database.*
*   **Body:** None
*   **Example Response:**
    ```json
    {
      "message": "Subscription cancelled successfully"
    }
    ```

### Get Favorites / Saved Posts
*   **Method:** `GET`
*   **URL:** `http://localhost:3000/api/v1/users/favorites`
*   **Body:** None
*   **Example Response:**
    *(Enforces blurring on premium posts if the user is not subscribed)*
    ```json
    {
      "favorites": [
        {
          "id": "post-id-uuid-1",
          "content": "Subscribers only morning workout!",
          "visibility": "PREMIUM",
          "creator": {
            "id": "creator-uuid",
            "username": "marcus_fit"
          },
          "media": [
            {
              "id": "media-uuid",
              "type": "IMAGE",
              "url": "https://picsum.photos/seed/onlymans-locked/400/400?blur=10"
            }
          ],
          "isLocked": true,
          "likesCount": 23,
          "commentsCount": 4,
          "isLiked": true,
          "bookmarkedAt": "2026-06-17T12:00:00Z"
        }
      ]
    }
    ```

---

## 2. Settings & Account Management

### Get Mock Payment Methods
*   **Method:** `GET`
*   **URL:** `http://localhost:3000/api/v1/users/payment-methods`
*   **Body:** None
*   **Example Response:**
    ```json
    {
      "paymentMethods": [
        {
          "id": "pm_1",
          "brand": "Visa",
          "last4": "4242",
          "expMonth": 12,
          "expYear": 2028
        }
      ]
    }
    ```

### Add Mock Payment Method
*   **Method:** `POST`
*   **URL:** `http://localhost:3000/api/v1/users/payment-methods`
*   **Body (JSON):**
    ```json
    {
      "brand": "MasterCard",
      "last4": "5555",
      "expMonth": 8,
      "expYear": 2030
    }
    ```
*   **Example Response:**
    ```json
    {
      "paymentMethod": {
        "id": "pm_1718612000000",
        "brand": "MasterCard",
        "last4": "5555",
        "expMonth": 8,
        "expYear": 2030
      }
    }
    ```

### Delete Mock Payment Method
*   **Method:** `DELETE`
*   **URL:** `http://localhost:3000/api/v1/users/payment-methods/{{methodId}}`
    *   *Replace `{{methodId}}` with the payment method ID (e.g., `pm_1`).*
*   **Body:** None
*   **Example Response:**
    ```json
    {
      "message": "Payment method removed successfully"
    }
    ```

### Deactivate User Account (Soft Delete)
*   **Method:** `DELETE`
*   **URL:** `http://localhost:3000/api/v1/users/profile`
*   **Body:** None
*   **Example Response:**
    ```json
    {
      "message": "Account deactivated successfully"
    }
    ```

---

## 3. Feed & Creator Discovery

### Get Random Discovery Feed
*   **Method:** `GET`
*   **URL:** `http://localhost:3000/api/v1/feed/random`
*   **Body:** None

### Explore & Search Creators
*   **Method:** `GET`
*   **URL:** `http://localhost:3000/api/v1/creators?category=Fitness`
    *   *Alternative filter:* `http://localhost:3000/api/v1/creators?search=gym`
*   **Body:** None

### Get Secure Creator Profile Details
*   **Method:** `GET`
*   **URL:** `http://localhost:3000/api/v1/creators/profile/secure/{{creatorId}}`
    *   *Replace `{{creatorId}}` with the creator's user ID UUID.*
*   **Body:** None

---

## 4. Likes, Comments & Favorites Toggling

### Toggle Post Like
*   **Method:** `POST`
*   **URL:** `http://localhost:3000/api/v1/posts/{{postId}}/like`
    *   *Replace `{{postId}}` with target post UUID.*
*   **Body:** None
*   **Example Response (when liked):**
    ```json
    {
      "liked": true
    }
    ```
*   **Example Response (when unliked):**
    ```json
    {
      "liked": false
    }
    ```

### Toggle Post Bookmark/Favorite
*   **Method:** `POST`
*   **URL:** `http://localhost:3000/api/v1/posts/{{postId}}/favorite`
    *   *Replace `{{postId}}` with target post UUID.*
*   **Body:** None
*   **Example Response (when bookmarked):**
    ```json
    {
      "bookmarked": true
    }
    ```
*   **Example Response (when removed from bookmarks):**
    ```json
    {
      "bookmarked": false
    }
    ```

### Add Comment to Post
*   **Method:** `POST`
*   **URL:** `http://localhost:3000/api/v1/posts/{{postId}}/comments`
    *   *Replace `{{postId}}` with target post UUID.*
*   **Body (JSON):**
    ```json
    {
      "content": "This photoshoot is amazing! Can't wait for the next video."
    }
    ```
*   **Example Response:**
    ```json
    {
      "comment": {
        "id": "comment-id-uuid",
        "postId": "post-id-uuid",
        "userId": "your-user-id-uuid",
        "content": "This photoshoot is amazing! Can't wait for the next video.",
        "createdAt": "2026-06-17T12:05:00.000Z",
        "updatedAt": "2026-06-17T12:05:00.000Z",
        "user": {
          "id": "your-user-id-uuid",
          "username": "johndoe"
        }
      }
    }
    ```

### Get Comments for Post
*   **Method:** `GET`
*   **URL:** `http://localhost:3000/api/v1/posts/{{postId}}/comments`
    *   *Replace `{{postId}}` with target post UUID.*
*   **Body:** None

### Delete Comment
*   **Method:** `DELETE`
*   **URL:** `http://localhost:3000/api/v1/posts/comments/{{commentId}}`
    *   *Replace `{{commentId}}` with comment UUID.*
*   **Body:** None
*   **Example Response:** (HTTP Status Code `204 No Content`)
