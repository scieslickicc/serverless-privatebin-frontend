import React, { useState, useEffect } from "react";
import { Link, useHistory } from "react-router-dom";
import {Nav, Navbar, NavItem} from "react-bootstrap";
import './App.css';
import Routes from "./Routes";
import { AppContext } from "./libs/contextLib";
import { LinkContainer } from "react-router-bootstrap";
import { Auth } from "aws-amplify";
import { onError } from "./libs/errorLib";
import ErrorBoundary from "./components/ErrorBoundary";
import { useTranslation } from 'react-i18next';

function App() {
  const history = useHistory();

  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isAuthenticated, userHasAuthenticated] = useState(false);

  const { t } = useTranslation();

  useEffect(() => {
    onLoad();
  }, []);

  async function onLoad() {
    try {
      await Auth.currentSession();
      userHasAuthenticated(true);
    } catch (e) {
      if (e !== 'No current user') {
        // onError(e);
      }
    }

    setIsAuthenticating(false);
  }

  return (
    !isAuthenticating && (
    <div className="App container">
      <Navbar fluid collapseOnSelect>
        <Navbar.Header>
          <Navbar.Brand href="/">
            <Link to="/">
              <img
                src="/img/szotki-napis.png"
                className="d-inline-block align-top logo"
                alt="Szotki" />{' '}- {t("encrypted notes")}...
            </Link>
          </Navbar.Brand>
          <Navbar.Toggle />
        </Navbar.Header>
        <Navbar.Collapse>
          <Nav pullRight>
            <LinkContainer to="/new">
              <NavItem>{t("New")}...</NavItem>
            </LinkContainer>
            <LinkContainer to="/about">
              <NavItem>{t("About")}</NavItem>
            </LinkContainer>
            {isAuthenticated ? (
              <NavItem onClick={handleLogout}>{t("Logout")}</NavItem>
            ) : (
              <>
                <LinkContainer to="/signup">
                  <NavItem>{t("Signup")}</NavItem>
                </LinkContainer>
                <LinkContainer to="/login">
                  <NavItem>{t("Login")}</NavItem>
                </LinkContainer>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Navbar>
      <ErrorBoundary>
        <AppContext.Provider
          value={{ isAuthenticated, userHasAuthenticated }}
        >
          <Routes />
        </AppContext.Provider>
      </ErrorBoundary>
    </div>
    )
  )

  async function handleLogout() {
    await Auth.signOut();

    userHasAuthenticated(false);

    history.push("/login");
  }
}

export default App;