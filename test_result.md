#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================
user_problem_statement: "TruckTrust freight marketplace (Shipper/Driver/Admin). Verify security-audit fixes did not regress core flows."
backend:
  - task: "Security fixes: object-level auth on offers/messages/disputes/bookings, 6-digit OTP with max attempts, OTP masking"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Applied IDOR fixes, 6-digit OTP, MAX_OTP_ATTEMPTS, _mask_otps for driver. Needs full regression."
frontend:
  - task: "Booking screen 6-digit OTP input + full shipper/driver flows"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/booking/[id].tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "OTP input updated to 6 chars. Needs e2e verification."
metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: true
test_plan:
  current_focus:
    - "Security fixes regression"
    - "Booking screen 6-digit OTP"
  stuck_tasks: []
  test_all: true
  test_priority: "high_first"
agent_communication:
  - agent: "main"
    message: "Verify end-to-end: register/login, shipper posts load, driver offers, shipper accepts -> booking, mock pay, driver enters pickup/delivery OTP (6-digit), ratings, admin stats. Also verify IDOR blocked (other users cannot read offers/messages/bookings not theirs) and OTP attempts limit."
  - task: "Forgot password: /api/auth/forgot-password, /api/auth/verify-reset-code, /api/auth/reset-password (email via Emergent Resend)"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py, /app/backend/email_service.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Code hashed in db.password_resets (bcrypt). Rate limit 3 sends/hour, 5 attempts. Register now requires accepted_terms=true."
  - task: "Frontend: onboarding walkthrough, forgot-password screen, terms screen, register redesign with T&C checkbox, login forgot link"
    implemented: true
    working: "NA"
    file: "/app/frontend/app/onboarding.tsx, /app/frontend/app/(auth)/*.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Onboarding shows once (AsyncStorage key tt_onboarding_done) when logged out."
agent_communication:
  - agent: "main"
    message: "Round 2: test security fixes regression + new auth features. For reset-code testing, the email can't be read; patch db.password_resets latest doc code_hash with bcrypt of a known code (see instructions)."
