import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';

const About = () => {
    const navigate = useNavigate();
    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState('');

    const handleInputChange = (e) => {
        setContactForm({
            ...contactForm,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus('');

        try {
            const response = await fetch('/api/v1/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contactForm)
            });

            if (response.ok) {
                setSubmitStatus('success');
                setContactForm({ name: '', email: '', subject: '', message: '' });
            } else {
                setSubmitStatus('error');
            }
        } catch (error) {
            console.error('Contact form error:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const projectFeatures = [
        {
            title: 'Real-time Notifications',
            description: 'Instant notifications using Socket.IO when money is received',
            icon: '🔔'
        },
        {
            title: 'Secure Authentication',
            description: 'JWT-based authentication with secure token management',
            icon: '🔐'
        },
        {
            title: 'Money Transfer',
            description: 'Seamless peer-to-peer money transfers with confirmation',
            icon: '💸'
        },
        {
            title: 'Transaction History',
            description: 'Complete transaction history with search and filter options',
            icon: '📊'
        },
        {
            title: 'User Management',
            description: 'Comprehensive user profiles and account management',
            icon: '👤'
        },
        {
            title: 'Responsive Design',
            description: 'Mobile-first responsive design that works on all devices',
            icon: '📱'
        }
    ];

    const techStack = [
        { name: 'React', description: 'Frontend UI library for building interactive interfaces' },
        { name: 'Node.js', description: 'Backend runtime environment for server-side JavaScript' },
        { name: 'Express.js', description: 'Web framework for building RESTful APIs' },
        { name: 'MongoDB', description: 'NoSQL database for storing user and transaction data' },
        { name: 'Socket.IO', description: 'Real-time bidirectional event-based communication' },
        { name: 'JWT', description: 'JSON Web Tokens for secure authentication' },
        { name: 'Tailwind CSS', description: 'Utility-first CSS framework for styling' },
        { name: 'Axios', description: 'HTTP client for making API requests' }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation Header */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">₹</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">QuickPe</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate("/")}
                                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                Home
                            </button>
                            <button
                                onClick={() => navigate("/signin")}
                                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => navigate("/signup")}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                        About <span className="text-blue-600">QuickPe</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        A modern digital wallet application built with the MERN stack, featuring real-time notifications, 
                        secure transactions, and a beautiful user interface.
                    </p>
                </div>
            </section>

            {/* Project Purpose */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Project Purpose</h2>
                        <div className="max-w-4xl mx-auto">
                            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                                QuickPe is a comprehensive digital wallet solution designed to demonstrate modern web development 
                                practices and technologies. This project showcases the implementation of a full-stack application 
                                with real-time features, secure authentication, and professional UI/UX design.
                            </p>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                The application serves as a portfolio project that highlights expertise in the MERN stack, 
                                real-time communication, and modern web development best practices.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Project Flow */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Project Flow</h2>
                        <p className="text-xl text-gray-600">How QuickPe works from user registration to money transfer</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">👤</span>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">1. User Registration</h3>
                            <p className="text-gray-600">Sign up with email, name, and secure password</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🔐</span>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">2. Authentication</h3>
                            <p className="text-gray-600">Secure login with JWT token-based authentication</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">💰</span>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">3. Money Transfer</h3>
                            <p className="text-gray-600">Send money to other users with confirmation</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🔔</span>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">4. Real-time Updates</h3>
                            <p className="text-gray-600">Instant notifications via Socket.IO</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Key Features</h2>
                        <p className="text-xl text-gray-600">Comprehensive features for a complete digital wallet experience</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {projectFeatures.map((feature, index) => (
                            <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                                <div className="text-4xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Technology Stack</h2>
                        <p className="text-xl text-gray-600">Built with modern, industry-standard technologies</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {techStack.map((tech, index) => (
                            <div key={index} className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{tech.name}</h3>
                                <p className="text-gray-600">{tech.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Developer Info */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Developer Information</h2>
                    </div>
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 text-center">
                            <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-white font-bold text-2xl">SH</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Siddharth Harsh Raj</h3>
                            <p className="text-lg text-gray-600 mb-4">Absolute Learner and Engineer</p>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                A passionate full-stack developer with expertise in modern web technologies. 
                                Experienced in building scalable applications with React, Node.js, and cloud technologies.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a 
                                    href="https://siddharth-dev.tech" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Visit Portfolio
                                </a>
                                <a 
                                    href="https://www.linkedin.com/in/siddharthharshraj/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="bg-white text-blue-600 px-6 py-3 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors font-medium"
                                >
                                    LinkedIn Profile
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Form */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Get In Touch</h2>
                        <p className="text-xl text-gray-600">Have questions or want to collaborate? Send me a message!</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={contactForm.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Your full name"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={contactForm.email}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="your.email@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject *
                                </label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={contactForm.subject}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="What's this about?"
                                />
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                    Message *
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={contactForm.message}
                                    onChange={handleInputChange}
                                    required
                                    rows={6}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Your message here..."
                                />
                            </div>
                            
                            {submitStatus === 'success' && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                                    Thank you for your message! I'll get back to you soon.
                                </div>
                            )}
                            
                            {submitStatus === 'error' && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                    Sorry, there was an error sending your message. Please try again.
                                </div>
                            )}
                            
                            <div className="text-center">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSubmitting ? 'Sending...' : 'Send Message'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default About;
