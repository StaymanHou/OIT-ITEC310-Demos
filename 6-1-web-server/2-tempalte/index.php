<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Web 2.0 - Template</title>
</head>
<body>
<h1>Web 2.0 - Template</h1>
<h1>
  Hello <?php echo htmlspecialchars(isset($_POST["fname"]) ? $_POST["fname"] : "World"); ?>!
  <?php echo "<br>Today is " . date("Y/m/d") . "<br>"; echo "The time is " . date("h:i:sa"); ?>
</h1>
<form method="POST">
  <label for="fname">First name:</label><br>
  <input type="text" id="fname" name="fname" value="John"><br>
  <label for="lname">Last name:</label><br>
  <input type="text" id="lname" name="lname" value="Doe"><br><br>
  <input type="submit" value="Submit">
</form> 
</body>
</html>