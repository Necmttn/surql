REMOVE DATABASE IF EXISTS taskmanager;
DEFINE DATABASE taskmanager;

-- Set up namespaces for multi-tenant architecture
DEFINE NAMESPACE production;
DEFINE NAMESPACE development;

-- Use the development namespace for now
USE NAMESPACE development;
USE DATABASE taskmanager;

-- Enable automatic GraphQL schema generation
DEFINE CONFIG GRAPHQL AUTO;

-- Define tables with SCHEMAFULL constraint for strict schema validation
DEFINE TABLE user SCHEMAFULL;
DEFINE TABLE organization SCHEMAFULL;
DEFINE TABLE team SCHEMAFULL;
DEFINE TABLE project SCHEMAFULL;
DEFINE TABLE task SCHEMAFULL;
DEFINE TABLE tag SCHEMAFULL;
DEFINE TABLE comment SCHEMAFULL;
DEFINE TABLE attachment SCHEMAFULL;
DEFINE TABLE activity SCHEMAFULL;
DEFINE TABLE sprint SCHEMAFULL;
DEFINE TABLE permission SCHEMAFULL;

-- Define a function to notify users of changes
DEFINE FUNCTION fn::notify_user($user_id: string, $message: string, $reference_type: string, $reference_id: string) {
    -- In production, this would send notifications through external services
    -- This is just a simplified example
    CREATE activity SET 
        user = $user_id,
        action = "notification",
        message = $message,
        reference_type = $reference_type,
        reference_id = $reference_id,
        created_at = time::now();
        
    RETURN true;
}
PERMISSIONS FULL;

-- Define a function to check permissions
DEFINE FUNCTION fn::check_permission($user_id: string, $resource_type: string, $resource_id: string, $action: string) {
    -- Check organization-level permissions
    LET $user = (SELECT * FROM user WHERE id = $user_id LIMIT 1)[0];
    LET $direct_permission = (
        SELECT * FROM permission 
        WHERE user = $user_id 
        AND resource_type = $resource_type 
        AND resource_id = $resource_id 
        AND $action IN actions
        LIMIT 1
    );
    
    -- Check if user is admin (has all permissions)
    LET $is_admin = (
        SELECT * FROM permission 
        WHERE user = $user_id 
        AND resource_type = 'organization' 
        AND role = 'admin'
        LIMIT 1
    );
    
    RETURN count($direct_permission) > 0 OR count($is_admin) > 0;
}
PERMISSIONS FULL;

---------------------------
-- USER TABLE
---------------------------

DEFINE FIELD id ON user TYPE string;
DEFINE FIELD email ON user TYPE string ASSERT string::is::email($value) COMMENT "User's email address";
DEFINE FIELD password ON user TYPE string COMMENT "Hashed password for user authentication";
DEFINE FIELD first_name ON user TYPE string COMMENT "User's first name";
DEFINE FIELD last_name ON user TYPE string COMMENT "User's last name";
DEFINE FIELD display_name ON user TYPE string COMMENT "User's display name shown in the UI";
DEFINE FIELD avatar ON user TYPE option<string> COMMENT "URL to user's avatar image";
DEFINE FIELD title ON user TYPE option<string> COMMENT "User's job title";
DEFINE FIELD department ON user TYPE option<string> COMMENT "User's department";
DEFINE FIELD phone ON user TYPE option<string> COMMENT "User's contact phone number";
DEFINE FIELD time_zone ON user TYPE string DEFAULT "UTC" COMMENT "User's preferred time zone";
DEFINE FIELD locale ON user TYPE string DEFAULT "en-US" COMMENT "User's preferred locale";
DEFINE FIELD status ON user TYPE string DEFAULT "active" ASSERT $value INSIDE ["active", "inactive", "pending", "suspended"] COMMENT "Current user account status";
DEFINE FIELD settings ON user TYPE object {
    email_notifications: bool,
    daily_digest: bool,
    theme: string,
    task_view: string
} DEFAULT {
    email_notifications: true,
    daily_digest: true,
    theme: "light",
    task_view: "list"
} COMMENT "User preferences and settings";
DEFINE FIELD organizations ON user TYPE array<record<organization>> COMMENT "Organizations the user belongs to";
DEFINE FIELD teams ON user TYPE array<record<team>> COMMENT "Teams the user belongs to";
DEFINE FIELD assigned_tasks ON user TYPE array<record<task>> COMMENT "Tasks assigned to the user";
DEFINE FIELD created_tasks ON user TYPE array<record<task>> COMMENT "Tasks created by the user";
DEFINE FIELD watching_tasks ON user TYPE array<record<task>> COMMENT "Tasks the user is watching";
DEFINE FIELD task_count ON user TYPE number DEFAULT 0 COMMENT "Total number of tasks assigned to user";
DEFINE FIELD completed_task_count ON user TYPE number DEFAULT 0 COMMENT "Number of tasks completed by user";
DEFINE FIELD created_at ON user TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the user was created";
DEFINE FIELD updated_at ON user TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the user was last updated";
DEFINE FIELD last_login ON user TYPE option<datetime> COMMENT "Timestamp of user's last login";

DEFINE INDEX user_email_idx ON user COLUMNS email UNIQUE;
DEFINE INDEX user_name_search_idx ON user COLUMNS first_name, last_name FULLTEXT;

---------------------------
-- ORGANIZATION TABLE
---------------------------

DEFINE FIELD id ON organization TYPE string;
DEFINE FIELD name ON organization TYPE string COMMENT "Organization name";
DEFINE FIELD slug ON organization TYPE string COMMENT "URL-friendly version of organization name";
DEFINE FIELD description ON organization TYPE option<string> COMMENT "Organization description";
DEFINE FIELD logo ON organization TYPE option<string> COMMENT "URL to organization logo";
DEFINE FIELD website ON organization TYPE option<string> COMMENT "Organization website URL";
DEFINE FIELD email_domains ON organization TYPE array<string> COMMENT "Email domains associated with this organization";
DEFINE FIELD subscription_plan ON organization TYPE string DEFAULT "free" ASSERT $value INSIDE ["free", "starter", "professional", "enterprise"] COMMENT "Subscription plan level";
DEFINE FIELD subscription_status ON organization TYPE string DEFAULT "active" ASSERT $value INSIDE ["active", "trial", "expired", "cancelled"] COMMENT "Status of organization's subscription";
DEFINE FIELD members ON organization TYPE array<record<user>> COMMENT "Users who are members of the organization";
DEFINE FIELD teams ON organization TYPE array<record<team>> COMMENT "Teams within the organization";
DEFINE FIELD projects ON organization TYPE array<record<project>> COMMENT "Projects belonging to the organization";
DEFINE FIELD owner ON organization TYPE record<user> COMMENT "User who owns the organization";
DEFINE FIELD created_at ON organization TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the organization was created";
DEFINE FIELD updated_at ON organization TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the organization was last updated";

DEFINE INDEX organization_slug_idx ON organization COLUMNS slug UNIQUE;
DEFINE INDEX organization_name_idx ON organization COLUMNS name FULLTEXT;

---------------------------
-- TEAM TABLE
---------------------------

DEFINE FIELD id ON team TYPE string;
DEFINE FIELD name ON team TYPE string COMMENT "Team name";
DEFINE FIELD description ON team TYPE option<string> COMMENT "Team description";
DEFINE FIELD organization ON team TYPE record<organization> COMMENT "Organization this team belongs to";
DEFINE FIELD icon ON team TYPE option<string> COMMENT "Team icon or avatar URL";
DEFINE FIELD color ON team TYPE option<string> COMMENT "Team color for UI display";
DEFINE FIELD members ON team TYPE array<record<user>> COMMENT "Users who are members of the team";
DEFINE FIELD manager ON team TYPE option<record<user>> COMMENT "User who manages the team";
DEFINE FIELD projects ON team TYPE array<record<project>> COMMENT "Projects assigned to this team";
DEFINE FIELD tasks ON team TYPE array<record<task>> COMMENT "Tasks assigned to this team";
DEFINE FIELD is_private ON team TYPE bool DEFAULT false COMMENT "Whether the team is private or visible to all organization members";
DEFINE FIELD created_at ON team TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the team was created";
DEFINE FIELD updated_at ON team TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the team was last updated";

DEFINE INDEX team_name_org_idx ON team COLUMNS organization, name UNIQUE;

---------------------------
-- PROJECT TABLE
---------------------------

DEFINE FIELD id ON project TYPE string;
DEFINE FIELD name ON project TYPE string COMMENT "Project name";
DEFINE FIELD key ON project TYPE string COMMENT "Short key used for task IDs (e.g., 'PROJ')";
DEFINE FIELD description ON project TYPE option<string> COMMENT "Project description";
DEFINE FIELD organization ON project TYPE record<organization> COMMENT "Organization this project belongs to";
DEFINE FIELD icon ON project TYPE option<string> COMMENT "Project icon URL";
DEFINE FIELD color ON project TYPE option<string> COMMENT "Project color for UI display";
DEFINE FIELD status ON project TYPE string DEFAULT "active" ASSERT $value INSIDE ["planning", "active", "on_hold", "completed", "archived"] COMMENT "Current project status";
DEFINE FIELD visibility ON project TYPE string DEFAULT "organization" ASSERT $value INSIDE ["private", "team", "organization", "public"] COMMENT "Project visibility level";
DEFINE FIELD start_date ON project TYPE option<datetime> COMMENT "Project start date";
DEFINE FIELD target_date ON project TYPE option<datetime> COMMENT "Project target completion date";
DEFINE FIELD actual_end_date ON project TYPE option<datetime> COMMENT "Actual project completion date";
DEFINE FIELD teams ON project TYPE array<record<team>> COMMENT "Teams assigned to this project";
DEFINE FIELD members ON project TYPE array<record<user>> COMMENT "Users directly assigned to this project";
DEFINE FIELD tasks ON project TYPE array<record<task>> COMMENT "Tasks in this project";
DEFINE FIELD task_count ON project TYPE number DEFAULT 0 COMMENT "Total number of tasks in the project";
DEFINE FIELD completed_task_count ON project TYPE number DEFAULT 0 COMMENT "Number of completed tasks in the project";
DEFINE FIELD active_sprint ON project TYPE option<record<sprint>> COMMENT "Currently active sprint for this project";
DEFINE FIELD sprints ON project TYPE array<record<sprint>> COMMENT "All sprints for this project";
DEFINE FIELD created_by ON project TYPE record<user> COMMENT "User who created the project";
DEFINE FIELD created_at ON project TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the project was created";
DEFINE FIELD updated_at ON project TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the project was last updated";

DEFINE INDEX project_key_org_idx ON project COLUMNS organization, key UNIQUE;
DEFINE INDEX project_name_org_idx ON project COLUMNS organization, name UNIQUE;

---------------------------
-- TASK TABLE
---------------------------

DEFINE FIELD id ON task TYPE string;
DEFINE FIELD number ON task TYPE number COMMENT "Sequential number within the project";
DEFINE FIELD key ON task TYPE string VALUE string::concat(parent.project.key, '-', string(number)) COMMENT "Unique task identifier (e.g., 'PROJ-123')";
DEFINE FIELD title ON task TYPE string COMMENT "Task title";
DEFINE FIELD description ON task TYPE option<string> COMMENT "Detailed task description";
DEFINE FIELD project ON task TYPE record<project> COMMENT "Project this task belongs to";
DEFINE FIELD type ON task TYPE string DEFAULT "task" ASSERT $value INSIDE ["task", "bug", "feature", "epic", "story", "subtask"] COMMENT "Task type";
DEFINE FIELD status ON task TYPE string DEFAULT "todo" ASSERT $value INSIDE ["todo", "in_progress", "in_review", "blocked", "done", "cancelled"] COMMENT "Current task status";
DEFINE FIELD priority ON task TYPE string DEFAULT "medium" ASSERT $value INSIDE ["highest", "high", "medium", "low", "lowest"] COMMENT "Task priority level";
DEFINE FIELD assignee ON task TYPE option<record<user>> COMMENT "User assigned to the task";
DEFINE FIELD reporter ON task TYPE record<user> COMMENT "User who reported/created the task";
DEFINE FIELD team ON task TYPE option<record<team>> COMMENT "Team assigned to the task";
DEFINE FIELD parent_task ON task TYPE option<record<task>> COMMENT "Parent task for subtasks";
DEFINE FIELD subtasks ON task TYPE array<record<task>> COMMENT "Subtasks of this task";
DEFINE FIELD dependencies ON task TYPE array<record<task>> COMMENT "Tasks this task depends on";
DEFINE FIELD dependents ON task TYPE array<record<task>> COMMENT "Tasks that depend on this task";
DEFINE FIELD estimate ON task TYPE option<decimal> COMMENT "Estimated time to complete (in hours)";
DEFINE FIELD actual_time ON task TYPE option<decimal> COMMENT "Actual time spent (in hours)";
DEFINE FIELD percentage_complete ON task TYPE number DEFAULT 0 COMMENT "Percentage of task completion";
DEFINE FIELD tags ON task TYPE array<record<tag>> COMMENT "Tags associated with this task";
DEFINE FIELD comments ON task TYPE array<record<comment>> COMMENT "Comments on this task";
DEFINE FIELD attachments ON task TYPE array<record<attachment>> COMMENT "Files attached to this task";
DEFINE FIELD watchers ON task TYPE array<record<user>> COMMENT "Users watching this task";
DEFINE FIELD sprint ON task TYPE option<record<sprint>> COMMENT "Sprint this task is assigned to";
DEFINE FIELD original_estimate ON task TYPE option<decimal> COMMENT "Original time estimate before changes";
DEFINE FIELD created_at ON task TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the task was created";
DEFINE FIELD updated_at ON task TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the task was last updated";
DEFINE FIELD started_at ON task TYPE option<datetime> COMMENT "When work was started on the task";
DEFINE FIELD completed_at ON task TYPE option<datetime> COMMENT "When the task was marked as complete";
DEFINE FIELD due_date ON task TYPE option<datetime> COMMENT "Task due date";

DEFINE INDEX task_key_idx ON task COLUMNS key UNIQUE;
DEFINE INDEX task_project_number_idx ON task COLUMNS project, number UNIQUE;
DEFINE INDEX task_title_search_idx ON task COLUMNS title FULLTEXT;

DEFINE EVENT task_status_change ON task WHEN $event = "UPDATE" AND $before.status != $after.status THEN {
    -- Record the status change in activity log
    CREATE activity SET
        user = $auth.id,
        action = "status_change",
        message = string::concat("Task ", $this.key, " status changed from ", $before.status, " to ", $after.status),
        reference_type = "task",
        reference_id = $this.id,
        created_at = time::now();
        
    -- If task marked as done, update completion time and percentage
    IF $after.status == "done" THEN
        UPDATE $this SET 
            completed_at = time::now(),
            percentage_complete = 100;
    END;
    
    -- If task moved from done to another status, clear completion time
    IF $before.status == "done" AND $after.status != "done" THEN
        UPDATE $this SET 
            completed_at = NONE,
            percentage_complete = 0;
    END;
    
    -- Notify assignee of status change if exists
    IF $this.assignee != NONE THEN
        LET $_ = fn::notify_user(
            $this.assignee.id, 
            string::concat("Task ", $this.key, " status changed to ", $after.status),
            "task",
            $this.id
        );
    END;
};

DEFINE EVENT task_assignee_change ON task WHEN $event = "UPDATE" AND $before.assignee != $after.assignee THEN {
    -- Record the assignee change in activity log
    CREATE activity SET
        user = $auth.id,
        action = "assignee_change",
        message = string::concat(
            "Task ", $this.key, " assignee changed from ", 
            $before.assignee != NONE ? $before.assignee.display_name : "unassigned", 
            " to ", 
            $after.assignee != NONE ? $after.assignee.display_name : "unassigned"
        ),
        reference_type = "task",
        reference_id = $this.id,
        created_at = time::now();
        
    -- Notify new assignee
    IF $after.assignee != NONE THEN
        LET $_ = fn::notify_user(
            $after.assignee.id, 
            string::concat("You have been assigned to task ", $this.key),
            "task",
            $this.id
        );
    END;
};

---------------------------
-- TAG TABLE
---------------------------

DEFINE FIELD id ON tag TYPE string;
DEFINE FIELD name ON tag TYPE string COMMENT "Tag name";
DEFINE FIELD color ON tag TYPE option<string> COMMENT "Tag color for UI display";
DEFINE FIELD organization ON tag TYPE record<organization> COMMENT "Organization this tag belongs to";
DEFINE FIELD project ON tag TYPE option<record<project>> COMMENT "Project this tag belongs to, if project-specific";
DEFINE FIELD tasks ON tag TYPE array<record<task>> COMMENT "Tasks with this tag";
DEFINE FIELD created_at ON tag TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the tag was created";

DEFINE INDEX tag_name_org_idx ON tag COLUMNS organization, name UNIQUE WHERE project IS NONE;
DEFINE INDEX tag_name_project_idx ON tag COLUMNS project, name UNIQUE WHERE project IS NOT NONE;

---------------------------
-- COMMENT TABLE
---------------------------

DEFINE FIELD id ON comment TYPE string;
DEFINE FIELD task ON comment TYPE record<task> COMMENT "Task this comment belongs to";
DEFINE FIELD user ON comment TYPE record<user> COMMENT "User who created the comment";
DEFINE FIELD content ON comment TYPE string COMMENT "Comment content";
DEFINE FIELD edited ON comment TYPE bool DEFAULT false COMMENT "Whether the comment has been edited";
DEFINE FIELD edit_history ON comment TYPE array<object> {
    content: string,
    edited_at: datetime
} COMMENT "History of edits to the comment";
DEFINE FIELD attachments ON comment TYPE array<record<attachment>> COMMENT "Files attached to this comment";
DEFINE FIELD mentioned_users ON comment TYPE array<record<user>> COMMENT "Users mentioned in the comment";
DEFINE FIELD created_at ON comment TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the comment was created";
DEFINE FIELD updated_at ON comment TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the comment was last updated";

DEFINE INDEX comment_task_created_idx ON comment COLUMNS task, created_at;

DEFINE EVENT comment_created ON comment WHEN $event = "CREATE" THEN {
    -- Notify task assignee if exists and not the commenter
    IF $this.task.assignee != NONE AND $this.task.assignee.id != $this.user.id THEN
        LET $_ = fn::notify_user(
            $this.task.assignee.id, 
            string::concat($this.user.display_name, " commented on task ", $this.task.key),
            "comment",
            $this.id
        );
    END;
    
    -- Notify task watchers
    FOR $watcher IN $this.task.watchers {
        IF $watcher.id != $this.user.id THEN
            LET $_ = fn::notify_user(
                $watcher.id, 
                string::concat($this.user.display_name, " commented on task ", $this.task.key, " that you're watching"),
                "comment",
                $this.id
            );
        END;
    };
};

---------------------------
-- ATTACHMENT TABLE
---------------------------

DEFINE FIELD id ON attachment TYPE string;
DEFINE FIELD name ON attachment TYPE string COMMENT "File name";
DEFINE FIELD description ON attachment TYPE option<string> COMMENT "File description";
DEFINE FIELD task ON attachment TYPE option<record<task>> COMMENT "Task this attachment belongs to";
DEFINE FIELD comment ON attachment TYPE option<record<comment>> COMMENT "Comment this attachment belongs to";
DEFINE FIELD user ON attachment TYPE record<user> COMMENT "User who uploaded the attachment";
DEFINE FIELD file_size ON attachment TYPE number COMMENT "File size in bytes";
DEFINE FIELD mime_type ON attachment TYPE string COMMENT "MIME type of the file";
DEFINE FIELD url ON attachment TYPE string COMMENT "URL to access the file";
DEFINE FIELD thumbnail_url ON attachment TYPE option<string> COMMENT "URL to file thumbnail, if available";
DEFINE FIELD created_at ON attachment TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the attachment was uploaded";

DEFINE INDEX attachment_name_idx ON attachment COLUMNS name FULLTEXT;

---------------------------
-- ACTIVITY TABLE
---------------------------

DEFINE FIELD id ON activity TYPE string;
DEFINE FIELD user ON activity TYPE option<record<user>> COMMENT "User who performed the activity";
DEFINE FIELD action ON activity TYPE string COMMENT "Type of activity performed";
DEFINE FIELD message ON activity TYPE string COMMENT "Description of the activity";
DEFINE FIELD reference_type ON activity TYPE string COMMENT "Type of resource the activity references";
DEFINE FIELD reference_id ON activity TYPE string COMMENT "ID of the resource the activity references";
DEFINE FIELD metadata ON activity TYPE option<object> FLEXIBLE COMMENT "Additional metadata about the activity";
DEFINE FIELD created_at ON activity TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the activity occurred";

DEFINE INDEX activity_reference_idx ON activity COLUMNS reference_type, reference_id, created_at;
DEFINE INDEX activity_user_idx ON activity COLUMNS user, created_at;

---------------------------
-- SPRINT TABLE
---------------------------

DEFINE FIELD id ON sprint TYPE string;
DEFINE FIELD name ON sprint TYPE string COMMENT "Sprint name";
DEFINE FIELD project ON sprint TYPE record<project> COMMENT "Project this sprint belongs to";
DEFINE FIELD goal ON sprint TYPE option<string> COMMENT "Sprint goal or objective";
DEFINE FIELD start_date ON sprint TYPE datetime COMMENT "Sprint start date";
DEFINE FIELD end_date ON sprint TYPE datetime COMMENT "Sprint end date";
DEFINE FIELD status ON sprint TYPE string DEFAULT "planning" ASSERT $value INSIDE ["planning", "active", "completed", "cancelled"] COMMENT "Current sprint status";
DEFINE FIELD tasks ON sprint TYPE array<record<task>> COMMENT "Tasks in this sprint";
DEFINE FIELD task_count ON sprint TYPE number DEFAULT 0 COMMENT "Total number of tasks in the sprint";
DEFINE FIELD completed_task_count ON sprint TYPE number DEFAULT 0 COMMENT "Number of completed tasks in the sprint";
DEFINE FIELD velocity ON sprint TYPE option<number> COMMENT "Team velocity for this sprint";
DEFINE FIELD created_at ON sprint TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the sprint was created";
DEFINE FIELD updated_at ON sprint TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the sprint was last updated";
DEFINE FIELD completed_at ON sprint TYPE option<datetime> COMMENT "When the sprint was completed";

DEFINE INDEX sprint_project_name_idx ON sprint COLUMNS project, name UNIQUE;
DEFINE INDEX sprint_dates_idx ON sprint COLUMNS project, start_date, end_date;

---------------------------
-- PERMISSION TABLE
---------------------------

DEFINE FIELD id ON permission TYPE string;
DEFINE FIELD user ON permission TYPE record<user> COMMENT "User who has the permission";
DEFINE FIELD resource_type ON permission TYPE string ASSERT $value INSIDE ["organization", "project", "team", "task"] COMMENT "Type of resource the permission applies to";
DEFINE FIELD resource_id ON permission TYPE string COMMENT "ID of the resource the permission applies to";
DEFINE FIELD role ON permission TYPE string ASSERT $value INSIDE ["admin", "manager", "member", "viewer"] COMMENT "Role of the user for this resource";
DEFINE FIELD actions ON permission TYPE array<string> COMMENT "Specific actions allowed (e.g., 'create', 'read', 'update', 'delete')";
DEFINE FIELD created_at ON permission TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the permission was created";
DEFINE FIELD updated_at ON permission TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the permission was last updated";

DEFINE INDEX permission_uniqueness_idx ON permission COLUMNS user, resource_type, resource_id UNIQUE;

-- Define permissions for security
DEFINE SCOPE account SESSION 24h
    SIGNUP ( CREATE user SET email = $email, password = crypto::argon2::generate($password), first_name = $first_name, last_name = $last_name, display_name = string::concat($first_name, " ", $last_name) )
    SIGNIN ( SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(password, $password) )
; 