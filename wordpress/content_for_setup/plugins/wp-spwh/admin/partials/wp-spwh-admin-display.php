<?php

/**
 * Provide a admin area view for the plugin
 *
 * This file is used to markup the admin-facing aspects of the plugin.
 *
 * @link       https://integrisweb.com
 * @since      1.0.0
 *
 * @package    Wp_Spwh
 * @subpackage Wp_Spwh/admin/partials
 */
?>

<!-- This file should primarily consist of HTML with a little bit of PHP. -->
<div class="wrap">

    <h2><?php echo esc_html(get_admin_page_title()); ?></h2>

    <form method="post" name="spwh_options" action="options.php">

    <?php
        // Get existing options.
        $options = get_option($this->plugin_name);
    ?>

    <?php
        settings_fields($this->plugin_name);
        do_settings_sections($this->plugin_name);
    ?>
        <p>This plugin sends a non-blocking POST request to your endpoint over HTTP/1.1 whenever <code>save_post</code> (<a href="https://codex.wordpress.org/Plugin_API/Action_Reference/save_post" rel="noopener" target="_blank">codex link</a>) or <code>edit_post</code> is triggered and the <code>post_status</code> is <code>pubish</code>, <code>private</code>, or <code>trash</code>. The sending domain&rsquo;s origin is included in the headers. The <code>post_id</code>, <code>post_title</code>, and <code>post_status</code> (<a href="https://codex.wordpress.org/Function_Reference/get_post_status" rel="noopener" target="_blank">codex link</a>) that triggered <code>save_post</code> are included in the body, as is the <code>api_key</code> (from the input, below).</p>

        <!-- Set POST endpoint. -->
        <fieldset>
            <legend class="screen-reader-text"><span>Set POST endpoint.</span></legend>
            <label for="<?php echo $this->plugin_name; ?>-endpoint">
                POST Endpoint:<br>
                <input class="large-text code" type="url" autocomplete="url" id="<?php echo $this->plugin_name; ?>-endpoint" name="<?php echo $this->plugin_name; ?>[endpoint]" value="<?php if(!empty($options['endpoint'])) echo $options['endpoint']; ?>"/>
            </label>
            <p class="description"><?php esc_attr_e('Enter the destination of your WebHook\'s POST request.', $this->plugin_name); ?></p>
        </fieldset>

        <!-- Set endpoint API Key. -->
        <fieldset>
            <legend class="screen-reader-text"><span>Set POST API key.</span></legend>
            <label for="<?php echo $this->plugin_name; ?>-endpoint">
                API Key:<br>
                <input class="large-text code" type="text" autocomplete="off" id="<?php echo $this->plugin_name; ?>-api_key" name="<?php echo $this->plugin_name; ?>[api_key]" value="<?php if(!empty($options['api_key'])) echo $options['api_key']; ?>"/>
            </label>
            <p class="description">If you have an API key, enter it for use in validating this request.</p>
        </fieldset>


        <?php submit_button('Save Changes', 'primary','submit', TRUE); ?>
    </form>
</div>
