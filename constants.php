<?php
/**
 * This file contains all of your plugin constants. It allows to manage them in one central place,
 * while making them seen for phpstan.
 *
 * @package Cookiex_CMP
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

define( 'COOKIEX_CMP_PLUGIN_PATH', plugin_dir_path( __FILE__ ) );
define( 'COOKIEX_CMP_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
