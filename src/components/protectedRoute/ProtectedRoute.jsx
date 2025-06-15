import { Navigate,Outlet} from "react-router-dom"
import useAuthStore from "@/store/authStore";

/**
 * 
 * @param {ReactNode} children: Elementos hijos que se renderizaran si se permite el acceso.  
 * @param {string} requiredRole: Rol requerido para acceder a la ruta
 * 
 * @description: Componente de ruta protegida que controla el acceso según el estado de autenticacion y el rol requerido. Redirige automaticamente si el usuario no cumple los requisitos.
 * @returns  {React.ReactNode} Si el usuario no esta autenticado o no tiene el rol requerido, se redirige a la pagina de login, si el usuario esta autenticado y tiene el rol requerido, se renderiza el componente que se le pase como children  
 * 
 * @example
 * <ProtectedRoute requiredRole="ADMIN">
 *  <AdminDashboard />
 * </ProtectedRoute>
 */

const ProtectedRoute = ({ children, requiredRole }) => {
    const { isAuthenticated, hasRole } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }

    if (requiredRole && !hasRole(requiredRole)) {
        return <Navigate to="/admin/login" replace />;
    }

    return children ? children : <Navigate to="/admin/" replace />;
};

export default ProtectedRoute;
