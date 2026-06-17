import "../assets/css/adminHeader.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBars} from "@fortawesome/free-solid-svg-icons";
import {useAuth} from "../AuthContext";

const getDisplayName = (user) => {
    const name = user?.name || user?.fullName || user?.email?.split("@")[0] || "Admin";
    return name.trim() || "Admin";
};

const AdminHeader = ({onMenuToggle}) => {
    const {user} = useAuth();
    const displayName = getDisplayName(user);

    return (
        <header className="admin-header">
            <div className="admin-header-left">
                <button className="admin-menu-toggle" type="button" aria-label="Open admin menu" onClick={onMenuToggle}>
                    <FontAwesomeIcon icon={faBars} />
                </button>
            </div>

            <div className="admin-header-right">
                <button className="icon-btn">
                    <i className="fa-regular fa-bell"></i>
                </button>

                <div className="admin-greeting" aria-label={`Hello, ${displayName}`}>
                    <span>Hello,</span>
                    <strong>{displayName}</strong>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
