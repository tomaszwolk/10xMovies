# REST API Plan for MyVOD

This document outlines the design for the MyVOD REST API, based on the provided product requirements, database schema, and technology stack.

## 1. Resources

- **Users**: Represents application users. Corresponds to `public.users_user` (custom Django user with UUID PK). User-specific data like preferences is handled via the `/api/me/` endpoint.
- **Platforms**: Represents VOD streaming platforms. Corresponds to the `platform` table. This is mostly read-only data for the frontend.
- **Movies**: Represents movie data from the IMDb dataset. Corresponds to the `movie` table. Primarily used for searching.
- **UserMovies**: Represents the relationship between a user and a movie (watchlist, watched history). Corresponds to the `user_movie` table. This is the main resource for user interactions.
- **Suggestions**: Represents AI-generated movie suggestions. This is a virtual resource generated on-demand via the `/api/suggestions/` endpoint and backed by the `ai_suggestion_batch` table for caching.

## 2. Authentication

Authentication will be handled using JSON Web Tokens (JWT), as specified in the tech stack (`djangorestframework-simplejwt`).

-   **Endpoint**: `/api/token/` (POST) - Obtains a new token pair (access, refresh).
-   **Endpoint**: `/api/token/refresh/` (POST) - Refreshes an access token.
-   **Endpoint**: `/api/token/verify/` (POST) - Verifies a token.

All endpoints requiring authentication must include the `Authorization: Bearer <access_token>` header.

## 3. Endpoints

### 3.1. Auth & User Management

#### `POST /api/register/`

-   **Description**: Creates a new user account.
-   **Authentication**: None.
-   **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "strongpassword123"
    }
    ```

-   **Success Response** (201 Created):
    ```json
    {
      "email": "user@example.com"
    }
    ```

-   **Error Responses**:
    -   `400 Bad Request`: Invalid email format, weak password, or user already exists.

#### `GET /api/me/`

-   **Description**: Retrieves the profile of the currently authenticated user, including their selected platforms.
-   **Authentication**: Required.
-   **Success Response** (200 OK):
    ```json
    {
      "email": "user@example.com",
      "platforms": [
        {"id": 1, "platform_slug": "netflix", "platform_name": "Netflix"},
        {"id": 2, "platform_slug": "hbo-max", "platform_name": "HBO Max"}
      ]
    }
    ```


#### `PATCH /api/me/`

-   **Description**: Updates the profile of the currently authenticated user, primarily for managing VOD platform selections.
-   **Authentication**: Required.
-   **Request Body**:
    ```json
    {
      "platforms": [1, 3]
    }
    ```

-   **Success Response** (200 OK):
    ```json
    {
      "email": "user@example.com",
      "platforms": [
        {"id": 1, "platform_slug": "netflix", "platform_name": "Netflix"},
        {"id": 3, "platform_slug": "disney-plus", "platform_name": "Disney+"}
      ]
    }
    ```


### 3.2. Movies & Platforms

#### `GET /api/platforms/`

-   **Description**: Retrieves a list of all available VOD platforms.
-   **Authentication**: None (public endpoint).
-   **Success Response** (200 OK):
    ```json
    [
      {"id": 1, "platform_slug": "netflix", "platform_name": "Netflix"},
      {"id": 2, "platform_slug": "hbo-max", "platform_name": "HBO Max"}
    ]
    ```


#### `GET /api/movies/`

-   **Description**: Searches for movies.
-   **Authentication**: None (public endpoint).
-   **Query Parameters**:
    -   `search` (string): The search query for the movie title (e.g., `?search=interstellar`).
-   **Success Response** (200 OK):
    ```json
    [
      {
        "tconst": "tt0816692",
        "primary_title": "Interstellar",
        "start_year": 2014,
        "avg_rating": "8.6",
        "poster_path": "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
      }
    ]
    ```


### 3.3. Watchlist & Watched History (`UserMovies`)

#### `GET /api/user-movies/`

-   **Description**: Retrieves the user's watchlist or watched history.
-   **Authentication**: Required (returns 401 when unauthenticated).
-   **Query Parameters**:
    -   `status` (string, required): `watchlist` or `watched`.
    -   `ordering` (string, optional): Allow-listed values: `-watchlisted_at`, `-tconst__avg_rating`.
    -   `is_available` (boolean, optional): If `true`, filter to movies available on at least one of the user's platforms; if `false`, filter to movies explicitly unavailable on all of the user's platforms (and with no `true` availability records). When omitted, no availability filter is applied.
-   **Success Response** (200 OK for `?status=watchlist`):
    ```json
    [
      {
        "id": 101,
        "movie": {
          "tconst": "tt0816692",
          "primary_title": "Interstellar",
          "start_year": 2014,
          "genres": ["Adventure", "Drama", "Sci-Fi"],
          "avg_rating": "8.6",
          "poster_path": "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
        },
        "availability": [
          {"platform_id": 1, "platform_name": "Netflix", "is_available": true}
        ],
        "watchlisted_at": "2025-10-12T10:00:00Z"
      }
    ]
    ```
-   **Error Responses**:
    - `400 Bad Request`: Missing/invalid `status`; invalid `ordering`; invalid `is_available` boolean.
    - `401 Unauthorized`: Missing or invalid authentication.

#### `POST /api/user-movies/`

-   **Description**: Adds a new movie to the user's watchlist.
-   **Authentication**: Required.
-   **Request Body**:
    ```json
    {
      "tconst": "tt0816692"
    }
    ```

-   **Success Response** (201 Created): Returns the newly created `user-movie` object.
  ```json
  {
    "id": 102,
    "movie": {
      "tconst": "tt0816692",
      "primary_title": "Interstellar",
      "start_year": 2014,
      "genres": ["Adventure", "Drama", "Sci-Fi"],
      "avg_rating": "8.6",
      "poster_path": "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
    },
    "availability": [
      {"platform_id": 1, "platform_name": "Netflix", "is_available": true},
      {"platform_id": 2, "platform_name": "HBO Max", "is_available": false}
    ],
    "watchlisted_at": "2025-10-12T14:30:00Z",
    "watched_at": null
  }
  ```
-   **Error Responses**:
    -   `400 Bad Request`:
        - Missing `tconst` field in request body
        - Movie with given `tconst` does not exist in database
        - Invalid `tconst` format
    -   `401 Unauthorized`: Not authenticated.
    -   `409 Conflict`: Movie is already on the watchlist.

#### `PATCH /api/user-movies/<id>/`

-   **Description**: Updates a user-movie entry. Used to move a movie to "watched", restore it to the watchlist, or soft-delete it.
-   **Authentication**: Required.
-   **Request Body** (to mark as watched):
    ```json
    {
      "action": "mark_as_watched"
    }
    ```

-   **Request Body** (to restore to watchlist):
    ```json
    {
      "action": "restore_to_watchlist"
    }
    ```

-   **Success Response** (200 OK): Returns the updated `user-movie` object.

#### `DELETE /api/user-movies/<id>/`

-   **Description**: Soft-deletes a movie from the user's watchlist.
-   **Authentication**: Required.
-   **Success Response** (204 No Content).

### 3.4. AI Suggestions

#### `GET /api/suggestions/`

-   **Description**: Generates or retrieves cached AI movie suggestions for the user.
-   **Authentication**: Required.
-   **Rate Limiting**: 1 request per calendar day (based on server date). User can receive new suggestions once per day, regardless of the exact time of previous request.
-   **Success Response** (200 OK):
    ```json
    {
      "expires_at": "2025-10-13T23:59:59Z",
      "suggestions": [
        {
          "tconst": "tt0133093",
          "primary_title": "The Matrix",
          "start_year": 1999,
          "justification": "Because you liked 'Inception', you might enjoy this classic sci-fi movie about simulated reality.",
          "availability": [
            {"platform_id": 2, "platform_name": "HBO Max", "is_available": true}
          ]
        }
      ]
    }
    ```
-   **Error Responses**:
    -   `429 Too Many Requests`: User has already received suggestions today.
    -   `404 Not Found`: User has no movies on their watchlist or watched history to base suggestions on.

## 4. Validation and Business Logic

-   **Unique Movies**: The API will rely on the database's `unique("user_id", "tconst")` constraint and handle the resulting `IntegrityError` to prevent duplicate entries.
-   **Password Strength**: The `/api/register/` endpoint will use a Django validator to enforce the password policy (min 8 chars, letters, and numbers).
-   **Background Tasks**: VOD availability checks will be run periodically by a Celery task, not triggered via the API. This task will populate the `movie_availability` table.
-   **Data Scoping**: All queries for user-specific data (watchlist, profile) will be implicitly filtered by the authenticated `user_id`, enforced by database Row Level Security.
