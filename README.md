### Supabase File Management Task

This repository contains the solution for the Lead Back-End Developer technical task. The project demonstrates proficiency with Supabase features, including **Row Level Security (RLS)**, **Supabase Storage**, and **Edge Functions** running on the Deno runtime.

---

### Project Components

* **Supabase Database**: A `files` table to store file metadata (`id`, `path`, `owner_id`).
* **Row Level Security (RLS)**: Policies are in place to ensure users can only access their own files.
* **Edge Function**: A `/getSignedUrl` endpoint that validates user ownership and provides a time-limited signed URL for file access.
* **Supabase Storage**: Used for hosting and serving the files.

---

### Getting Started

#### Prerequisites

You will need the following installed:

* **Supabase CLI**: `npm install -g supabase-cli` or `brew install supabase/tap/supabase`
* **Deno**: (For running the Edge Function locally)

#### Setup and Local Run

1.  **Clone the repository**:
    ```bash
    git clone [your_repo_url]
    cd [your_repo_name]
    ```

2.  **Create a Supabase Project**:
    * Log in to your Supabase account and create a new project.
    * Take note of your project's `API URL` and `anon key`.

3.  **Link the Supabase CLI**:
    ```bash
    supabase login
    supabase link --project-ref [your_project_id]
    ```

4.  **Set up Environment Variables**:
    * Copy the `.env.example` file to `.env.local` and fill in your Supabase details.
    ```bash
    cp .env.example .env.local
    ```
    `.env.local`
    ```
    SUPABASE_URL="[your_project_url]"
    SUPABASE_ANON_KEY="[your_anon_key]"
    ```

5.  **Run Migrations**:
    * Apply the database schema and RLS policies using the migration files provided.
    ```bash
    supabase db push
    ```
    *Note: The migrations will create the `files` table and apply the necessary RLS policies.*

6.  **Serve the Edge Function Locally**:
    ```bash
    supabase functions serve --no-verify-jwt
    ```
    *This will start a local server for the `/getSignedUrl` Edge Function.*

---

### Test Cases

To demonstrate that the solution works as expected, you can run the following tests.

#### Test Case 1: Enrolled User Can Get a Signed URL

1.  **Create a User**: Sign up a new user via the Supabase Auth UI or the API.
2.  **Get the User's JWT**: Use the Supabase client library or an API tool to log in and get the user's JWT.
3.  **Insert a file record**: Use the Supabase client to add an entry to the `files` table, linking it to your user's ID. The path should correspond to a file you've uploaded to Supabase Storage.
    * Example: `path: 'private/my-report.pdf'`
4.  **Make the API call**: Use `curl` to call the local Edge Function with the JWT.
    ```bash
    curl -i --location --request POST 'http://localhost:54321/functions/v1/getSignedUrl' \
    --header 'Authorization: Bearer [your_user_jwt]' \
    --header 'Content-Type: application/json' \
    --data-raw '{ "filePath": "private/my-report.pdf" }'
    ```
    *Expected result: A JSON response containing a signed URL that is valid for ~60 seconds. You should be able to access the file using this URL.*

#### Test Case 2: Different User Cannot Get a Signed URL

1.  **Create a second user**: Sign up another user and get their JWT.
2.  **Make the API call**: Use `curl` to call the Edge Function with the second user's JWT.
    ```bash
    curl -i --location --request POST 'http://localhost:54321/functions/v1/getSignedUrl' \
    --header 'Authorization: Bearer [your_second_user_jwt]' \
    --header 'Content-Type: application/json' \
    --data-raw '{ "filePath": "private/my-report.pdf" }'
    ```
    *Expected result: A `403 Forbidden` response, confirming that the second user cannot access the first user's file, even with a valid JWT.*
