import React, { useState } from "react";
import { Auth } from "aws-amplify";
import {FormGroup, FormControl, ControlLabel, ListGroup, ListGroupItem, Grid, Col} from "react-bootstrap";
import LoaderButton from "../../components/LoaderButton";
import { useAppContext } from "../../libs/contextLib";
import { useFormFields } from "../../libs/hooksLib";
import { onError } from "../../libs/errorLib";
import "./Login.css";
import {useTranslation} from 'react-i18next';
import {Link} from "react-router-dom";

export default function Login() {
  const { t } = useTranslation();

  const { userHasAuthenticated, storedUserId, setStoredUserId } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [fields, handleFieldChange] = useFormFields({
    email: "",
    password: ""
  });

  console.log(useAppContext());
  function validateForm() {
    return fields.email.length > 0 && fields.password.length > 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setIsLoading(true);

    try {
      const user = await Auth.signIn(fields.email, fields.password);

      userHasAuthenticated(true);
      setStoredUserId(user.username);
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  return (
    <div className="Login">
      <form onSubmit={handleSubmit}>
        <FormGroup controlId="email" bsSize="large">
          <ControlLabel>{t("Email")}</ControlLabel>
          <FormControl
            autoFocus
            type="email"
            value={fields.email}
            onChange={handleFieldChange}
          />
        </FormGroup>
        <FormGroup controlId="password" bsSize="large">
          <ControlLabel>{t("Password")}</ControlLabel>
          <FormControl
            type="password"
            value={fields.password}
            onChange={handleFieldChange}
          />
        </FormGroup>
        <Grid fluid={true}>
          <Col sm={5}>
            <Link to="/signup">{t("Signup")}...</Link>
          </Col>
          <Col sm={7}>
            <Link to="/reset">{t("Forget Password")}...</Link>
          </Col>
        </Grid>
        <br/>
        <LoaderButton
          block
          type="submit"
          bsSize="large"
          isLoading={isLoading}
          disabled={!validateForm()}
        >
          {t("Login")}
        </LoaderButton>
      </form>
    </div>
  );
}