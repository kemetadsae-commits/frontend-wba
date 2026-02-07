
import React, { useState, useEffect, useContext } from 'react';
import { authFetch } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { FaTrash, FaUserPlus, FaUserShield, FaUserFriends, FaUserCog } from 'react-icons/fa';
import PageLayout from '../components/PageLayout';
import { theme } from '../styles/theme';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for the "Add New User" form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('viewer'); // Default role for new users

  const { user: loggedInUser } = useContext(AuthContext);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await authFetch('/users');
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return alert('Please fill out all fields.');
    }
    try {
      const data = await authFetch('/users', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });
      if (data.success) {
        alert('User created successfully!');
        // Reset form
        setName('');
        setEmail('');
        setPassword('');
        setRole('viewer');
        fetchUsers(); // Refresh the user list
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await authFetch(`/users/${userId}`, { method: 'DELETE' });
      alert('User deleted successfully.');
      fetchUsers(); // Refresh the user list
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <PageLayout>
      <div className="w-full max-w-6xl mx-auto space-y-8 p-4 md:p-0">
        <h1 className="text-3xl font-bold text-white text-center mb-8 drop-shadow-lg">
          User Management
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create User Form - 1 Column */}
          <div className={`lg:col-span-1 ${theme.glassCard} p-6 h-fit sticky top-4`}>
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <div className="bg-emerald-500/20 p-3 rounded-full text-emerald-400">
                <FaUserPlus size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">Add New User</h2>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Full Name</label>
                <input type="text" placeholder="e.g. John Doe" value={name} onChange={(e) => setName(e.target.value)} className={theme.inputStyle} required />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Email Address</label>
                <input type="email" placeholder="e.g. john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={theme.inputStyle} required />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Password</label>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={theme.inputStyle} required />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Role</label>
                <div className="relative">
                  <select value={role} onChange={(e) => setRole(e.target.value)} className={`${theme.inputStyle} appearance-none cursor-pointer`}>
                    <option value="viewer">Viewer</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                  </div>
                </div>
              </div>

              <button type="submit" className={`${theme.primaryGradientBtn} mt-2 w-full flex justify-center py-3 font-bold shadow-lg shadow-red-900/30`}>
                Create User
              </button>
            </form>
          </div>

          {/* Existing Users List - 2 Columns */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3 mb-2 px-2">
              <FaUserFriends className="text-gray-400" size={24} />
              <h2 className="text-2xl font-bold text-white">Existing Users</h2>
              <span className="bg-white/10 text-xs font-bold px-2 py-1 rounded-full text-gray-300 border border-white/5">{users.length}</span>
            </div>

            {isLoading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500"></div>
              </div>
            ) : (
              <div className={`${theme.glassCard} overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-black/40 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((user) => (
                        <tr key={user._id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-xs font-bold text-white border border-white/10 mr-3">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="text-sm font-medium text-white group-hover:text-red-200 transition-colors">{user.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono tracking-wide">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.role === 'admin' ? 'bg-red-900/40 text-red-200 border-red-700/50' :
                                user.role === 'manager' ? 'bg-blue-900/40 text-blue-200 border-blue-700/50' :
                                  'bg-gray-700/40 text-gray-300 border-gray-600/50'
                              }`}>
                              {user.role === 'admin' && <FaUserShield className="mr-1.5" size={10} />}
                              {user.role === 'manager' && <FaUserCog className="mr-1.5" size={10} />}
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                            {/* Prevent an admin from deleting themselves */}
                            {loggedInUser._id !== user._id ? (
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="text-gray-500 hover:text-red-500 transition-colors p-2 hover:bg-white/5 rounded-full"
                                title="Delete User"
                              >
                                <FaTrash />
                              </button>
                            ) : (
                              <span className="text-xs text-gray-600 select-none">Current</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-6 py-8 text-center text-gray-500 italic">No users found. Create one to get started.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}