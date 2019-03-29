<?php

/**
 * The admin-specific functionality of the plugin.
 *
 * @link       https://integrisweb.com
 * @since      1.0.0
 *
 * @package    Wp_Spwh
 * @subpackage Wp_Spwh/admin
 */

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    Wp_Spwh
 * @subpackage Wp_Spwh/admin
 * @author     Ben Forshey <hello@integrisweb.com>
 */
class Wp_Spwh_Admin {

	/**
	 * The ID of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $plugin_name    The ID of this plugin.
	 */
	private $plugin_name;

	/**
	 * The version of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $version    The current version of this plugin.
	 */
	private $version;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @since    1.0.0
	 * @param      string    $plugin_name       The name of this plugin.
	 * @param      string    $version    The version of this plugin.
	 */
	public function __construct( $plugin_name, $version ) {

		$this->plugin_name = $plugin_name;
		$this->version = $version;
		$this->wp_spwh_options = get_option($this->plugin_name);

	}

	/**
	 * Register the stylesheets for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_styles() {

		/**
		 * This function is provided for demonstration purposes only.
		 *
		 * An instance of this class should be passed to the run() function
		 * defined in Wp_Spwh_Loader as all of the hooks are defined
		 * in that particular class.
		 *
		 * The Wp_Spwh_Loader will then create the relationship
		 * between the defined hooks and the functions defined in this
		 * class.
		 */

		wp_enqueue_style( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'css/wp-spwh-admin.css', array(), $this->version, 'all' );

	}

	/**
	 * Register the JavaScript for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_scripts() {

		/**
		 * This function is provided for demonstration purposes only.
		 *
		 * An instance of this class should be passed to the run() function
		 * defined in Wp_Spwh_Loader as all of the hooks are defined
		 * in that particular class.
		 *
		 * The Wp_Spwh_Loader will then create the relationship
		 * between the defined hooks and the functions defined in this
		 * class.
		 */

		wp_enqueue_script( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'js/wp-spwh-admin.js', array( 'jquery' ), $this->version, false );

	}

	// Add a settings page for this plugin to the Settings menu.
	// http://codex.wordpress.org/Administration_Menus
	public function add_plugin_admin_menu() {
		add_options_page('Save Post WebHook Options', 'SP WebHook', 'manage_options', $this->plugin_name, array($this, 'display_plugin_setup_page'));
	}

	// Add settings action link to the plugins page.
	// https://codex.wordpress.org/Plugin_API/Filter_Reference/plugin_action_links_(plugin_file_name)
	public function add_action_links($links) {
		$settings_link = array(
			'<a href="' . admin_url( 'options-general.php?page=' . $this->plugin_name ) . '">' . __('Settings', $this->plugin_name) . '</a>',
		);
		return array_merge($settings_link, $links);
	}

	// Render the settings page for this plugin.
	public function display_plugin_setup_page() {
		include_once('partials/wp-spwh-admin-display.php');
	}

	public function options_update() {
		register_setting($this->plugin_name, $this->plugin_name, array($this, 'validate'));
	}

	// Validate input.
	public function validate($input) {
		$valid = array();

		// Endpoint.
		$valid['endpoint'] = esc_url($input['endpoint']);

		// API Key.
		$valid['api_key'] = sanitize_text_field($input['api_key']);

		return $valid;
	}

	public function send_notification_to_endpoint ($post_id) {
		$url = $this->wp_spwh_options['endpoint'];
		$api_key = $this->wp_spwh_options['api_key'];

		$status = get_post_status($post_id);
		$acceptable_status = array('publish', 'private', 'trash');
		$filter = current_filter();

		$title = get_the_title($post_id);
		$origin = site_url();

		// Return early if this is a post revision from the 'save_post' action.
		if ($filter === 'save_post' && wp_is_post_revision($post_id) === false) {
			return;
		}

		// Return early if this isn't one of the statuses we should be watching for.
		if (in_array($status, $acceptable_status) === false) {
			return;
		}

		// Send the POST request.
		return wp_remote_post($url, array(
			'method'      => 'POST',
			'httpversion' => '1.1',
			'blocking'    => false,
			'headers'     => array(
				'origin'        => $origin
			),
			'body'        => array(
				'post_id'       => $post_id,
				'post_title'    => $title,
				'post_status'	=> $status,
				'api_key'		=> $api_key
			)
		));
	}
}
