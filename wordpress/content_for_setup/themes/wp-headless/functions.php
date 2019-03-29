 <?php
// Allow anonymous comments over REST API v2.
// Credit: https://www.contradodigital.com/2016/04/06/post-comments-wordpress-rest-api-version-2/
// Hook: https://developer.wordpress.org/reference/hooks/rest_allow_anonymous_comments/
// API Docs: https://developer.wordpress.org/rest-api/reference/comments/
function filter_rest_allow_anonymous_comments () {
    return true;
}

add_filter('rest_allow_anonymous_comments', 'filter_rest_allow_anonymous_comments');


// Remove default post type from WordPress Dashboard
// https://codex.wordpress.org/Function_Reference/remove_menu_page
function iw_remove_default_post_type_menu_item() {
	remove_menu_page('edit.php');
}

// add_action('admin_menu','iw_remove_default_post_type_menu_item');
