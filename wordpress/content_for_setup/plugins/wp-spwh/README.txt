=== Plugin Name ===
Contributors: (this should be a list of wordpress.org userid's)
Donate link: https://integrisweb.com
Tags: webhook
Requires at least: 4.8.2
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

A plugin to notify an endpoint when content has been updated through `save_post` or `edit_post` hook, limited to certain statuses.

== Description ==

A plugin to notify an endpoint when content has been updated through `save_post` or `edit_post` hook. Sends `origin` in header, `post_id`, `post_title`, `post_status`, and `api_key` in body. Only triggers when post status is `publish`, `private`, or `trash`.
