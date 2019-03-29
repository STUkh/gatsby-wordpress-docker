<?php

/**
 * The plugin bootstrap file
 *
 * This file is read by WordPress to generate the plugin information in the plugin
 * admin area. This file also includes all of the dependencies used by the plugin,
 * registers the activation and deactivation functions, and defines a function
 * that starts the plugin.
 *
 * @link              https://integrisweb.com
 * @since             1.0.0
 * @package           Wp_Spwh
 *
 * @wordpress-plugin
 * Plugin Name:       Save Post WebHook
 * Plugin URI:        https://integrisweb.com
 * Description:       A plugin to notify an endpoint when content has been updated through 'save_post' or 'edit_post' hook. Sends 'origin' in header, 'post_id' and 'post_title' in body.
 * Version:           1.0.1
 * Author:            Ben Forshey
 * Author URI:        https://integrisweb.com
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       wp-spwh
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

define( 'PLUGIN_NAME_VERSION', '1.0.0' );

/**
 * The code that runs during plugin activation.
 * This action is documented in includes/class-wp-spwh-activator.php
 */
function activate_wp_spwh() {
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-wp-spwh-activator.php';
	Wp_Spwh_Activator::activate();
}

/**
 * The code that runs during plugin deactivation.
 * This action is documented in includes/class-wp-spwh-deactivator.php
 */
function deactivate_wp_spwh() {
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-wp-spwh-deactivator.php';
	Wp_Spwh_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_wp_spwh' );
register_deactivation_hook( __FILE__, 'deactivate_wp_spwh' );

/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require plugin_dir_path( __FILE__ ) . 'includes/class-wp-spwh.php';

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    1.0.0
 */
function run_wp_spwh() {

	$plugin = new Wp_Spwh();
	$plugin->run();

}
run_wp_spwh();
