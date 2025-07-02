
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // Here you would implement actual sign up logic
    console.log('Sign up attempt with:', { phoneNumber, email, password });
    // For now, redirect to main page
    navigate('/');
  };

  const handleGoogleSignUp = () => {
    // Google sign up logic would go here
    console.log('Google sign up clicked');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 mx-auto mb-8 relative">
            <img 
              src="/lovable-uploads/3228b102-769a-43ee-92c5-9f0c0b2b928e.png" 
              alt="Network Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Sign Up</h1>
        </div>

        {/* Sign Up Form */}
        <form onSubmit={handleSignUp} className="space-y-6">
          <div>
            <Input
              type="tel"
              placeholder="Phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="h-14 bg-gray-900 border-gray-700 text-white placeholder-gray-400 rounded-xl text-lg"
              required
            />
          </div>

          <div>
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 bg-gray-900 border-gray-700 text-white placeholder-gray-400 rounded-xl text-lg"
              required
            />
          </div>

          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 bg-gray-900 border-gray-700 text-white placeholder-gray-400 rounded-xl text-lg"
              required
            />
          </div>

          <div>
            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-14 bg-gray-900 border-gray-700 text-white placeholder-gray-400 rounded-xl text-lg"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-lg rounded-xl shadow-lg shadow-green-500/25"
          >
            Sign Up
          </Button>

          <div className="text-center">
            <span className="text-gray-400 text-lg">or</span>
          </div>

          <Button
            type="button"
            onClick={handleGoogleSignUp}
            variant="outline"
            className="w-full h-14 bg-transparent border-gray-700 text-white hover:bg-gray-900 rounded-xl"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign up with Google
          </Button>
        </form>

        {/* Login Link */}
        <div className="text-center mt-8">
          <span className="text-gray-400">Already have an account? </span>
          <button
            onClick={() => navigate('/login')}
            className="text-green-500 hover:text-green-400 font-semibold"
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
