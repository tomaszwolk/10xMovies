#!/bin/bash
# MyVOD API Testing Helper Script
# Usage: ./test-api.sh [command]

set -e

# Configuration
BASE_URL="${MYVOD_BASE_URL:-http://localhost:8000/api}"
TOKEN_FILE=".api-token"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ $1${NC}"; }

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    print_info "jq not found. Install it for better JSON formatting: brew install jq (macOS) or apt-get install jq (Linux)"
    JQ_CMD="cat"
else
    JQ_CMD="jq '.'"
fi

# Load token from file if exists
load_token() {
    if [ -f "$TOKEN_FILE" ]; then
        export ACCESS_TOKEN=$(cat "$TOKEN_FILE")
        print_info "Token loaded from $TOKEN_FILE"
    fi
}

# Save token to file
save_token() {
    echo "$1" > "$TOKEN_FILE"
    print_success "Token saved to $TOKEN_FILE"
}

# Command: Login
cmd_login() {
    local email="${1:-test@example.com}"
    local password="${2:-testpass123}"
    
    print_info "Logging in as $email..."
    
    response=$(curl -s -X POST "$BASE_URL/token/" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    if echo "$response" | jq -e '.access' > /dev/null 2>&1; then
        ACCESS_TOKEN=$(echo "$response" | jq -r '.access')
        save_token "$ACCESS_TOKEN"
        export ACCESS_TOKEN
        print_success "Login successful!"
        echo "$response" | eval $JQ_CMD
    else
        print_error "Login failed!"
        echo "$response" | eval $JQ_CMD
        exit 1
    fi
}

# Command: Get watchlist
cmd_watchlist() {
    load_token
    
    if [ -z "$ACCESS_TOKEN" ]; then
        print_error "Not logged in. Run: ./test-api.sh login"
        exit 1
    fi
    
    local status="${1:-watchlist}"
    local url="$BASE_URL/user-movies/?status=$status"
    
    # Add optional parameters
    [ -n "$2" ] && url="${url}&ordering=$2"
    [ -n "$3" ] && url="${url}&is_available=$3"
    
    print_info "Fetching $status..."
    
    curl -s -X GET "$url" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        | eval $JQ_CMD
}

# Command: Add movie
cmd_add() {
    load_token
    
    if [ -z "$ACCESS_TOKEN" ]; then
        print_error "Not logged in. Run: ./test-api.sh login"
        exit 1
    fi
    
    local tconst="${1:-tt0816692}"
    
    print_info "Adding movie $tconst to watchlist..."
    
    response=$(curl -s -X POST "$BASE_URL/user-movies/" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"tconst\":\"$tconst\"}")
    
    if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
        print_success "Movie added successfully!"
        echo "$response" | eval $JQ_CMD
    else
        print_error "Failed to add movie!"
        echo "$response" | eval $JQ_CMD
        exit 1
    fi
}

# Command: Mark as watched
cmd_watch() {
    load_token
    
    if [ -z "$ACCESS_TOKEN" ]; then
        print_error "Not logged in. Run: ./test-api.sh login"
        exit 1
    fi
    
    local movie_id="$1"
    
    if [ -z "$movie_id" ]; then
        print_error "Usage: ./test-api.sh watch <movie_id>"
        exit 1
    fi
    
    print_info "Marking movie #$movie_id as watched..."
    
    curl -s -X PATCH "$BASE_URL/user-movies/$movie_id/" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"action":"mark_as_watched"}' \
        | eval $JQ_CMD
}

# Command: Delete movie
cmd_delete() {
    load_token
    
    if [ -z "$ACCESS_TOKEN" ]; then
        print_error "Not logged in. Run: ./test-api.sh login"
        exit 1
    fi
    
    local movie_id="$1"
    
    if [ -z "$movie_id" ]; then
        print_error "Usage: ./test-api.sh delete <movie_id>"
        exit 1
    fi
    
    print_info "Deleting movie #$movie_id..."
    
    status_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -X DELETE "$BASE_URL/user-movies/$movie_id/" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if [ "$status_code" = "204" ]; then
        print_success "Movie deleted successfully!"
    else
        print_error "Failed to delete movie (HTTP $status_code)"
        exit 1
    fi
}

# Command: Get profile
cmd_profile() {
    load_token
    
    if [ -z "$ACCESS_TOKEN" ]; then
        print_error "Not logged in. Run: ./test-api.sh login"
        exit 1
    fi
    
    print_info "Fetching user profile..."
    
    curl -s -X GET "$BASE_URL/me/" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        | eval $JQ_CMD
}

# Command: Search movies
cmd_search() {
    load_token
    
    if [ -z "$ACCESS_TOKEN" ]; then
        print_error "Not logged in. Run: ./test-api.sh login"
        exit 1
    fi
    
    local query="$1"
    
    if [ -z "$query" ]; then
        print_error "Usage: ./test-api.sh search <query>"
        exit 1
    fi
    
    print_info "Searching for '$query'..."
    
    curl -s -X GET "$BASE_URL/movies/?search=$query" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        | eval $JQ_CMD
}

# Command: Help
cmd_help() {
    cat << EOF
MyVOD API Testing Helper

Usage: ./test-api.sh <command> [options]

Commands:
  login [email] [password]     Login and save token (default: test@example.com / testpass123)
  profile                       Get user profile
  watchlist [status] [ordering] [is_available]
                               Get user movies (status: watchlist|watched)
  add <tconst>                 Add movie to watchlist
  watch <movie_id>             Mark movie as watched
  delete <movie_id>            Delete movie from watchlist
  search <query>               Search for movies
  help                         Show this help

Examples:
  ./test-api.sh login
  ./test-api.sh watchlist
  ./test-api.sh watchlist watched
  ./test-api.sh add tt0816692
  ./test-api.sh watch 123
  ./test-api.sh delete 123
  ./test-api.sh search interstellar

Environment Variables:
  MYVOD_BASE_URL    API base URL (default: http://localhost:8000/api)

Token Storage:
  Token is saved in $TOKEN_FILE and automatically loaded for subsequent commands.
EOF
}

# Main command dispatcher
case "${1:-help}" in
    login)
        cmd_login "$2" "$3"
        ;;
    profile)
        cmd_profile
        ;;
    watchlist|watched)
        cmd_watchlist "$@"
        ;;
    add)
        cmd_add "$2"
        ;;
    watch)
        cmd_watch "$2"
        ;;
    delete)
        cmd_delete "$2"
        ;;
    search)
        cmd_search "$2"
        ;;
    help|--help|-h)
        cmd_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        cmd_help
        exit 1
        ;;
esac

