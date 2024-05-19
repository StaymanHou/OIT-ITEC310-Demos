<?php

if ($_SERVER['REQUEST_URI'] == '/') {
  session_start();

  echo 'Reading session data! <br />';

  var_dump($_SESSION);
}

if ($_SERVER['REQUEST_URI'] == '/set') {
  session_start();

  echo 'Setting data to your session';

  $options = array("Neo", "Morpheus", "Trinity", "Cypher", "Tank");
  $rand_key = array_rand($options, 1);

  $_SESSION['random_data']    = $options[$rand_key];
  $_SESSION['last_visit']     = time();
}

?>
