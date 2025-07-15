import React from "react";

export const UserContext = React.createContext({
    user: null,
    setUser: () => {},
    logout: () => {},
});


// if user is falsy, means that was not established an authenticated session client-server

// user object:
// id: ,
// name: ,
// canDoTotp: ,
// isLoggedWithTotp: