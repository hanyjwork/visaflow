import Admin from './pages/Admin';
import Cart from './pages/Cart';
import Confirmation from './pages/Confirmation';
import EditApplication from './pages/EditApplication';
import Home from './pages/Home';
import Terms from './pages/Terms';
import Track from './pages/Track';
import KnownCustomerLogin from './pages/KnownCustomerLogin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Cart": Cart,
    "Confirmation": Confirmation,
    "EditApplication": EditApplication,
    "Home": Home,
    "Terms": Terms,
    "Track": Track,
    "KnownCustomerLogin": KnownCustomerLogin,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};