import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import "./createUser.css";
import {toast} from "react-toastify";

export default function CreateUser() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        role: "", // This will store role _id
    });

    const [roles, setRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Fetch roles
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const {data} = await axios.get("/api/roles");
                setRoles(data);
            } catch (err) {
                toast.error("Failed to load roles");
                setRoles([]);
            } finally {
                setLoadingRoles(false);
            }
        };
        fetchRoles();
    }, []);

    const handleChange = (e) => {
        const {name, value} = e.target;
        setForm((prev) => ({...prev, [name]: value}));
        setErrors((prev) => ({...prev, [name]: ""}));
    };

    const validate = () => {
        const e = {};
        if (!form.firstName.trim()) e.firstName = "First name is required.";
        if (!form.lastName.trim()) e.lastName = "Last name is required.";
        if (!form.email.trim()) e.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email.";
        if (!form.role) e.role = "Please select a role.";
        return e;
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);

        try {
            const payload = {
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim().toLowerCase(),
                role: form.role, // Send role _id
            };

            await axios.post("/api/admin/users", payload);

            toast.success("User created successfully!");
            navigate("/admin/view-users");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create user");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => navigate(-1);
    const handleCreateRole = () => navigate("/admin/create-roles");

    return (
        <div className="cu-wrapper">
            <div className="cu-card">
                <div className="cu-topbar">
                    <button className="cu-back-btn" type="button" onClick={handleCancel}>
                        <span className="cu-back-arrow">‹</span> Back
                    </button>
                    <h1 className="cu-title">Create User</h1>

                    <button className="cu-btn-create-role" type="button" onClick={handleCreateRole}>
                        Create Role
                    </button>
                </div>

                <form className="cu-form" onSubmit={handleSave} noValidate>
                    <div className="cu-form-row">
                        <div className={`cu-field ${errors.firstName ? "cu-field--error" : ""}`}>
                            <label className="cu-label" htmlFor="firstName">
                                First Name
                            </label>
                            <input id="firstName" name="firstName" type="text" placeholder="Enter" value={form.firstName} onChange={handleChange} className="cu-input" />
                            {errors.firstName && <span className="cu-error-msg">{errors.firstName}</span>}
                        </div>

                        <div className={`cu-field ${errors.lastName ? "cu-field--error" : ""}`}>
                            <label className="cu-label" htmlFor="lastName">
                                Last Name
                            </label>
                            <input id="lastName" name="lastName" type="text" placeholder="Enter" value={form.lastName} onChange={handleChange} className="cu-input" />
                            {errors.lastName && <span className="cu-error-msg">{errors.lastName}</span>}
                        </div>
                    </div>

                    <div className="cu-form-row">
                        <div className={`cu-field ${errors.email ? "cu-field--error" : ""}`}>
                            <label className="cu-label" htmlFor="email">
                                Email
                            </label>
                            <input id="email" name="email" type="email" placeholder="Enter" value={form.email} onChange={handleChange} className="cu-input" />
                            {errors.email && <span className="cu-error-msg">{errors.email}</span>}
                        </div>

                        <div className={`cu-field ${errors.role ? "cu-field--error" : ""}`}>
                            <label className="cu-label" htmlFor="role">
                                Role
                            </label>
                            <div className="cu-select-wrap">
                                <select id="role" name="role" value={form.role} onChange={handleChange} className="cu-select" disabled={loadingRoles}>
                                    <option value="" disabled>
                                        {loadingRoles ? "Loading..." : "Select role"}
                                    </option>
                                    {roles.map((r) => (
                                        <option key={r._id} value={r._id}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                                <svg className="cu-select-chevron" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                                </svg>
                            </div>
                            {errors.role && <span className="cu-error-msg">{errors.role}</span>}
                        </div>
                    </div>

                    <div className="cu-form-footer">
                        <button type="button" className="cu-btn cu-btn--cancel" onClick={handleCancel}>
                            Cancel
                        </button>
                        <button type="submit" className="cu-btn cu-btn--save" disabled={loading}>
                            {loading ? "Creating..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
