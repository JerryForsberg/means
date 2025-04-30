import { createBrowserRouter } from 'react-router';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './components/LandingPage';
import CustomCalendar from './components/CustomCalendar'


export const router = createBrowserRouter([
    {
        path: '/',
        element: <LandingPage />,
    },
    {
        path: '/calendar',
        element: <ProtectedRoute><CustomCalendar /></ProtectedRoute>,
    },
]);