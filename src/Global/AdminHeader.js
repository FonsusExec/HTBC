import "../assets/css/adminHeader.css";
// import logo from "../assets/img/htbc-logo.png";

const AdminHeader = ({userName = "Admin"}) => {
    return (
        <header className="admin-header">
            {/* Left */}
            <div className="admin-header-left">{/* <img src={logo} alt="Logo" className="admin-logo" /> */}</div>

            {/* Right */}
            <div className="admin-header-right">
                <button className="icon-btn">
                    <i className="fa-regular fa-bell"></i>
                </button>

                <div className="admin-user">
                    <img src="https://i.pravatar.cc/40" alt="User" className="admin-avatar" />
                    <span className="admin-name">{userName}</span>
                    <i className="fa-solid fa-chevron-down"></i>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
