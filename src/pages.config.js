import Admin from './pages/Admin';
import Cart from './pages/Cart';
import Confirmation from './pages/Confirmation';
import EditApplication from './pages/EditApplication';
import Home from './pages/Home';
import KnownCustomerLogin from './pages/KnownCustomerLogin';
import Terms from './pages/Terms';
import Track from './pages/Track';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Cart": Cart,
    "Confirmation": Confirmation,
    "EditApplication": EditApplication,
    "Home": Home,
    "KnownCustomerLogin": KnownCustomerLogin,
    "Terms": Terms,
    "Track": Track,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};