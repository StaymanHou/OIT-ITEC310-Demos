import React from "react";
import { Typography } from "@mui/material";

import "./styles.css";

/**
 * Define UserDetail, a React component of CS142 Project 5.
 */
class UserDetail extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Typography variant="body1">
        This should be the UserDetail view of the PhotoShare app. Since it is
        invoked from React Router the params from the route will be in property
        match. So this should show details of user:
        {this.props.match.params.userId}. You can fetch the model for the user
        from window.cs142models.userModel(userId).
      </Typography>
    );
  }
}

export default UserDetail;
