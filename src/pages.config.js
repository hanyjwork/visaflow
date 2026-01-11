import Admin from './pages/Admin';
import Cart from './pages/Cart';
import Confirmation from './pages/Confirmation';
import EditApplication from './pages/EditApplication';
import Terms from './pages/Terms';
import Track from './pages/Track';
import Home from './pages/Home';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Cart": Cart,
    "Confirmation": Confirmation,
    "EditApplication": EditApplication,
    "Terms": Terms,
    "Track": Track,
    "Home": Home,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};