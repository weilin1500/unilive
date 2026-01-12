import React, { useState } from 'react';

const Auth: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="h-screen w-full flex flex-col justify-center items-center bg-black p-8 text-white">
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">unilive</h1>
      <p className="text-gray-400 mb-10">Connect. Create. Live.</p>

      <div className="w-full max-w-sm space-y-4">
        <input 
            type="text" 
            placeholder="Username or Email" 
            className="w-full bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 focus:border-cyan-500 outline-none"
        />
        <input 
            type="password" 
            placeholder="Password" 
            className="w-full bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 focus:border-cyan-500 outline-none"
        />
        
        {!isLogin && (
            <input 
                type="password" 
                placeholder="Confirm Password" 
                className="w-full bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 focus:border-cyan-500 outline-none"
            />
        )}

        <button 
            onClick={onLogin}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-cyan-500/30"
        >
            {isLogin ? 'Log In' : 'Sign Up'}
        </button>
      </div>

      <div className="mt-8 text-sm text-gray-400">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button onClick={() => setIsLogin(!isLogin)} className="text-cyan-400 font-semibold underline">
            {isLogin ? 'Sign Up' : 'Log In'}
        </button>
      </div>

      <div className="mt-8 flex gap-4">
         <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black font-bold">G</div>
         <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">F</div>
         <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold">A</div>
      </div>
    </div>
  );
};

export default Auth;
