import {useEffect, useMemo, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {loadStripe} from "@stripe/stripe-js";
import {Elements, PaymentElement, useElements, useStripe} from "@stripe/react-stripe-js";
import axios from "axios";
import {toast} from "react-toastify";
import Loading from "../../components/Loading";
import "./donationForm.css";
import {findDonationItemById, getDonationItemById} from "./donationItems";
import {isDemoMode} from "../../demo/demoMode";
import {getDemoImpactStoryById} from "../../demo/demoData";

const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : Promise.resolve(null);
const AMOUNT_OPTIONS = [25, 50, 100, 250];

function DonationPaymentForm({amount, donation, form, onValidate, onSuccess}) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (onValidate && !onValidate()) {
            return;
        }

        if (!stripe || !elements) {
            toast.error("Payment form is still loading.");
            return;
        }

        setIsProcessing(true);

        try {
            const {error: submitError} = await elements.submit();
            if (submitError) {
                toast.error(submitError.message || "Please check your payment details.");
                setIsProcessing(false);
                return;
            }

            const returnUrl = `${window.location.origin}${window.location.pathname}#/donationform/${donation.id}`;
            const {error: stripeError, paymentIntent} = await stripe.confirmPayment({
                elements,
                redirect: "if_required",
                confirmParams: {
                    return_url: returnUrl,
                    payment_method_data: {
                        billing_details: {
                            name: form.fullName,
                            email: form.email,
                            phone: form.phone,
                        },
                    },
                },
            });

            if (stripeError) {
                toast.error(stripeError.message || "Payment failed. Please try again.");
                setIsProcessing(false);
                return;
            }

            if (paymentIntent?.status === "succeeded") {
                const {data} = await axios.post("/api/donations", {
                    campaignId: donation.id,
                    campaignTitle: donation.title,
                    donor: {
                        fullName: form.fullName.trim(),
                        email: form.email.trim(),
                        phone: form.phone.trim(),
                    },
                    amount,
                    currency: "usd",
                    paymentId: paymentIntent.id,
                });

                toast.success("Thank you for your donation!");
                onSuccess(data.donation);
            } else {
                toast.info(`Payment status: ${paymentIntent?.status || "processing"}.`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || "Donation failed. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form className="df-payment-form" onSubmit={handleSubmit}>
            <div className="df-payment-box">
                <PaymentElement />
            </div>
            <button className="df-submit" type="submit" disabled={isProcessing || !stripe || !elements}>
                {isProcessing ? "Processing..." : `Donate $${amount.toFixed(2)}`}
            </button>
        </form>
    );
}

export default function DonationForm() {
    const {donationId} = useParams();
    const navigate = useNavigate();
    const localDonation = useMemo(() => findDonationItemById(donationId) || (!donationId ? getDonationItemById() : null), [donationId]);

    const [form, setForm] = useState({
        fullName: "",
        phone: "",
        email: "",
    });
    const [storyDonation, setStoryDonation] = useState(null);
    const [donationLoading, setDonationLoading] = useState(false);
    const [donationError, setDonationError] = useState("");
    const [selectedAmount, setSelectedAmount] = useState("50");
    const [customAmount, setCustomAmount] = useState("");
    const [clientSecret, setClientSecret] = useState("");
    const [intentLoading, setIntentLoading] = useState(false);
    const [intentError, setIntentError] = useState("");
    const [completedDonation, setCompletedDonation] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    const donationAmount = selectedAmount === "custom" ? Number(customAmount) : Number(selectedAmount);
    const validAmount = Number.isFinite(donationAmount) && donationAmount > 0 ? donationAmount : 0;
    const donation = localDonation || (storyDonation?.id === donationId ? storyDonation : null);

    useEffect(() => {
        let isActive = true;

        setStoryDonation(null);
        setDonationError("");

        if (!donationId || localDonation) {
            setDonationLoading(false);
            return () => {
                isActive = false;
            };
        }

        const fetchImpactStory = async () => {
            try {
                setDonationLoading(true);

                if (isDemoMode) {
                    const demoStory = getDemoImpactStoryById(donationId);
                    if (isActive) {
                        if (demoStory) {
                            setStoryDonation({
                                id: demoStory._id,
                                title: demoStory.title,
                                desc: demoStory.description,
                                detail: demoStory.description,
                                img: demoStory.imageUrl,
                            });
                        } else {
                            setDonationError("This demo impact story could not be found.");
                        }
                    }
                    return;
                }

                const {data} = await axios.get(`/api/impact-stories/${donationId}`);

                if (isActive) {
                    setStoryDonation({
                        id: data._id,
                        title: data.title,
                        desc: data.description,
                        detail: data.description,
                        img: data.imageUrl,
                    });
                }
            } catch (err) {
                if (isActive) {
                    setDonationError(err.response?.data?.message || "Unable to load this impact story.");
                }
            } finally {
                if (isActive) setDonationLoading(false);
            }
        };

        fetchImpactStory();

        return () => {
            isActive = false;
        };
    }, [donationId, localDonation]);

    useEffect(() => {
        setCompletedDonation(null);
    }, [donation?.id]);

    useEffect(() => {
        if (!donation || !validAmount) {
            setClientSecret("");
            return;
        }

        if (isDemoMode) {
            setClientSecret("");
            setIntentLoading(false);
            setIntentError("Demo mode preview: payment submission is disabled.");
            return;
        }

        let isActive = true;
        const timer = setTimeout(async () => {
            try {
                setIntentLoading(true);
                setIntentError("");
                const amountInCents = Math.round(validAmount * 100);
                const {data} = await axios.post("/api/create-payment-intent", {amount: amountInCents});

                if (isActive) {
                    setClientSecret(data.clientSecret || "");
                }
            } catch (err) {
                if (isActive) {
                    setClientSecret("");
                    setIntentError(err.response?.data?.error || "Unable to initialize Stripe payment.");
                }
            } finally {
                if (isActive) setIntentLoading(false);
            }
        }, 350);

        return () => {
            isActive = false;
            clearTimeout(timer);
        };
    }, [validAmount, donation?.id]);

    const validateDonationForm = () => {
        const errors = {};
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!form.fullName.trim()) errors.fullName = "Full name is required.";
        if (!form.phone.trim()) errors.phone = "Phone number is required.";
        if (!form.email.trim()) {
            errors.email = "Email is required.";
        } else if (!emailPattern.test(form.email.trim())) {
            errors.email = "Enter a valid email address.";
        }
        if (!validAmount) errors.amount = "Enter a valid donation amount.";

        setValidationErrors(errors);

        if (Object.keys(errors).length > 0) {
            toast.error("Please complete the required donation fields.");
            return false;
        }

        return true;
    };

    const handleChange = (e) => {
        const {name, value} = e.target;
        setForm({...form, [name]: value});
        if (validationErrors[name]) {
            setValidationErrors((errors) => ({...errors, [name]: ""}));
        }
    };

    const handleAmountSelect = (amount) => {
        setSelectedAmount(amount);
        if (amount !== "custom") setCustomAmount("");
        if (validationErrors.amount) setValidationErrors((errors) => ({...errors, amount: ""}));
    };

    const handleCustomAmountChange = (e) => {
        setCustomAmount(e.target.value);
        if (validationErrors.amount) setValidationErrors((errors) => ({...errors, amount: ""}));
    };

    if (donationLoading) {
        return (
            <div className="df-page">
                <div className="df-shell">
                    <header className="df-header">
                        <button className="df-back" type="button" onClick={() => navigate("/donate")}>
                            <span className="df-back-arrow">&#8249;</span>
                            Back
                        </button>
                    </header>

                    <section className="df-card df-status-card">
                        <Loading message="Loading donation..." />
                    </section>
                </div>
            </div>
        );
    }

    if (donationError || !donation) {
        return (
            <div className="df-page">
                <div className="df-shell">
                    <header className="df-header">
                        <button className="df-back" type="button" onClick={() => navigate("/donate")}>
                            <span className="df-back-arrow">&#8249;</span>
                            Back
                        </button>
                    </header>

                    <section className="df-card df-status-card">
                        <h1 className="df-title">Donation Unavailable</h1>
                        <p className={donationError ? "df-error" : "df-muted"}>{donationError || "This donation item could not be found."}</p>
                    </section>
                </div>
            </div>
        );
    }

    return (
        <div className="df-page">
            <div className="df-shell">
                <header className="df-header">
                    <button className="df-back" type="button" onClick={() => navigate("/donate")}>
                        <span className="df-back-arrow">&#8249;</span>
                        Back
                    </button>
                </header>

                <div className="df-layout">
                    <section className="df-left">
                        <div className="df-image-wrapper">
                            <img src={donation.img} alt={donation.title} className="df-image" />
                        </div>
                        <div className="df-description">
                            <h2 className="df-org-title">{donation.title}</h2>
                            <p className="df-org-text">{donation.detail}</p>
                        </div>
                    </section>

                    <section className="df-card">
                        {completedDonation ? (
                            <div className="df-success">
                                <div className="df-success-mark">&#10003;</div>
                                <h1 className="df-title">Donation Received</h1>
                                <p>Thank you for supporting {donation.title}.</p>
                                <div className="df-receipt">
                                    <span>Amount</span>
                                    <strong>${Number(completedDonation.amount || validAmount).toFixed(2)}</strong>
                                </div>
                                <div className="df-receipt">
                                    <span>Reference</span>
                                    <strong>{completedDonation.donationId}</strong>
                                </div>
                                <button className="df-submit" type="button" onClick={() => navigate("/donate")}>
                                    Donate Again
                                </button>
                            </div>
                        ) : (
                            <>
                                <h1 className="df-title">Donation Form</h1>

                                <div className="df-form">
                                    <div className="df-field">
                                        <label className="df-label" htmlFor="fullName">
                                            Full Name
                                        </label>
                                        <input id="fullName" className={`df-input ${validationErrors.fullName ? "df-input--error" : ""}`} type="text" name="fullName" placeholder="Enter" value={form.fullName} onChange={handleChange} />
                                        {validationErrors.fullName && <p className="df-field-error">{validationErrors.fullName}</p>}
                                    </div>

                                    <div className="df-field">
                                        <label className="df-label" htmlFor="phone">
                                            Phone Number
                                        </label>
                                        <input id="phone" className={`df-input ${validationErrors.phone ? "df-input--error" : ""}`} type="tel" name="phone" placeholder="Enter" value={form.phone} onChange={handleChange} />
                                        {validationErrors.phone && <p className="df-field-error">{validationErrors.phone}</p>}
                                    </div>

                                    <div className="df-field">
                                        <label className="df-label" htmlFor="email">
                                            E-mail
                                        </label>
                                        <input id="email" className={`df-input ${validationErrors.email ? "df-input--error" : ""}`} type="email" name="email" placeholder="Enter" value={form.email} onChange={handleChange} />
                                        {validationErrors.email && <p className="df-field-error">{validationErrors.email}</p>}
                                    </div>

                                    <div className="df-field">
                                        <label className="df-label">Donate Amount</label>
                                        <div className="df-amount-pills">
                                            {AMOUNT_OPTIONS.map((amount) => (
                                                <button key={amount} type="button" className={`df-pill ${selectedAmount === String(amount) ? "df-pill--active" : ""}`} onClick={() => handleAmountSelect(String(amount))}>
                                                    ${amount}
                                                </button>
                                            ))}
                                            <button type="button" className={`df-pill ${selectedAmount === "custom" ? "df-pill--active" : ""}`} onClick={() => handleAmountSelect("custom")}>
                                                Custom
                                            </button>
                                        </div>
                                        {selectedAmount === "custom" && (
                                            <div className={`df-custom-amount ${validationErrors.amount ? "df-custom-amount--error" : ""}`}>
                                                <span>$</span>
                                                <input className={`df-input ${validationErrors.amount ? "df-input--error" : ""}`} type="number" min="1" step="0.01" placeholder="Enter amount" value={customAmount} onChange={handleCustomAmountChange} />
                                            </div>
                                        )}
                                        {validationErrors.amount && <p className="df-field-error">{validationErrors.amount}</p>}
                                    </div>

                                    <div className="df-field">
                                        <label className="df-label">Card Information</label>
                                        {intentLoading && <p className="df-muted">Preparing secure payment form...</p>}
                                        {intentError && <p className="df-error">{intentError}</p>}
                                        {!intentLoading && !intentError && clientSecret && (
                                            <Elements key={clientSecret} stripe={stripePromise} options={{clientSecret, appearance: {theme: "stripe"}}}>
                                                <DonationPaymentForm amount={validAmount} donation={donation} form={form} onValidate={validateDonationForm} onSuccess={setCompletedDonation} />
                                            </Elements>
                                        )}
                                        {!validAmount && <p className="df-error">Enter a donation amount to continue.</p>}
                                    </div>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
