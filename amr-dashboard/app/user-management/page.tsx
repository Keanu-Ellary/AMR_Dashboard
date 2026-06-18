"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/app/services/authService";
import { getAllAdmins, registerAdmin, deleteAdmin } from "@/app/services/adminService";
import type { AdminUser } from "@/types/user_types";
import { toast } from "react-toastify";
import {
  Search,
  Trash,
  FilterX,
} from "lucide-react";

export default function UserManagementPage() {
    const router = useRouter();
    const [showAddNewAdminModal, setShowAddNewAdminModal] = useState(false);
    const [showDeleteAdminModal, setShowDeleteAdminModal] = useState(false);
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [adminSearch, setAdminSearch] = useState("");
    const [newAdminName, setNewAdminName] = useState("");
    const [newAdminSurname, setNewAdminSurname] = useState("");
    const [newAdminEmail, setNewAdminEmail] = useState("");
    const [selectedAdminToDelete, setSelectedAdminToDelete] = useState<AdminUser | null>(null);

    useEffect(() => {
        checkAdmin();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

    // Authenticate Admin
    const checkAdmin = async () => {
        try {
          const user = await getMe();
          if (user?.isAdmin) {
            await handleGetAllAdmins(user?.token);
          } else {
            toast.error("Access denied. Admin authorization required.");
            router.push("/home");
          }
        } catch (err) {
          router.push("/home");
        }
    };

    const handleGetAllAdmins = async (token: string) => {
        try {
            const admins = await getAllAdmins(token);
            setAdminUsers(Array.isArray(admins) ? admins : admins.adminUsers ?? []);
        } catch {
            toast.error('Failed to get all admins.')
        }
    }

    const handleAddNewAdmin = async () => {
        try{
            const user = await getMe();
            const adminData = {
                name: newAdminName,
                surname: newAdminSurname,
                email: newAdminEmail
            }
            const newAdminResponse = await registerAdmin(user?.token, adminData);
            if (newAdminResponse.status == 201) {
                toast.success("Admin added successfully!");
                setShowAddNewAdminModal(false);
                handleGetAllAdmins(user?.token);
                setNewAdminName("");
                setNewAdminSurname("");
                setNewAdminEmail("");
            }
        } catch {
            toast.error('Failed to add new admin.')
        }
    }

    const handleConfirmDeleteAdmin = async (admin: AdminUser) => {
        try {
            setShowDeleteAdminModal(true)
            setSelectedAdminToDelete(admin)
        }catch {
            toast.error('Failed to delete admin');
        }
    }

    const handleDeleteAdmin = async () => {
        try {
            const user = await getMe();
            if (selectedAdminToDelete) {
                await deleteAdmin(user?.token, selectedAdminToDelete?.id);
                toast.success('Admin deleted successfully.');
                setShowDeleteAdminModal(false);
                setSelectedAdminToDelete(null);
                handleGetAllAdmins(user?.token);
            }
        }catch {
            toast.error('Failed to delete admin');
        }
    }

      const filteredAdmins = useMemo(() => {
        return adminUsers.filter((admin) =>
          admin.name.toLowerCase().includes(adminSearch.toLowerCase())
        );
      }, [adminUsers, adminSearch]);

    return(
        <main className="flex-1 overflow-auto p-6 bg-slate-50/50 flex flex-col gap-6 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-indigo-950 tracking-tight">Admin Management</h1>
                    <p className="text-sm text-slate-500 font-medium">Add and delete admin users</p>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center relative">

                    <button
                        onClick={() => setShowAddNewAdminModal(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all"
                    >
                        Add Admin
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-4 max-w-[1400px]">

                <div className="flex-1 min-h-0 overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-inner flex flex-col">
                     <div className="relative w-full sm:w-64 group p-4">
                            <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search admins..."
                                value={adminSearch}
                                onChange={(e) => setAdminSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>

                    <div className="overflow-auto flex-1 px-4 pb-4">
                        <table className="w-full text-left border-collapse min-w-[800px] border border-slate-100 rounded-2xl">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Admin Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Surname</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {filteredAdmins.map((admin) => {
                                    return (
                                    <tr
                                        key={admin.email}
                                        className={`hover:bg-slate-50/50 transition-colors cursor-pointer`}
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-800">{admin.name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-800">{admin.surname}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-800">{admin.email}</td>
                                        <td 
                                            className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-800"
                                            onClick={() => handleConfirmDeleteAdmin(admin)}
                                        >
                                            <Trash className="h-4 w-4"/>
                                        </td>
                                    </tr>
                                    );
                                })}
                                {filteredAdmins.length === 0 && (
                                    <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm">
                                        <FilterX className="h-8 w-8 mx-auto mb-2 opacity-50 text-slate-400" />
                                        No admins match the search terms.
                                    </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

        {showDeleteAdminModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-4 border border-slate-100 p-8">
                <div>
                    <h3 className="font-black text-indigo-950 text-lg uppercase tracking-widest">Delete Admin</h3>
                    <p className="text-md text-slate-500 font-medium leading-relaxed">
                        Confirm deletion of:
                        <strong className="text-indigo-950 block mt-1 max-h-24 overflow-y-auto font-black border border-slate-50 p-2 rounded-lg bg-slate-50">
                            { selectedAdminToDelete?.name } { selectedAdminToDelete?.surname } ({ selectedAdminToDelete?.email })
                        </strong>
                    </p>
                </div>

                <div className="flex gap-2 mt-2">
                <button
                    onClick={() => setShowDeleteAdminModal(false)}
                    className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                    Cancel
                </button>
                <button
                    onClick={handleDeleteAdmin}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-30 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm"
                >
                    Delete
                </button>
                </div>
            </div>
            </div>
        )}

        {showAddNewAdminModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-4 border border-slate-100 p-8">
                <div>
                    <h3 className="font-black text-indigo-950 text-lg uppercase tracking-widest">Add New Admin</h3>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        <span className="text-[12px] font-black text-slate-400 uppercase">Name</span>
                        <input
                            type="text"
                            placeholder="Name" 
                            value={newAdminName}
                            onChange={(e) => setNewAdminName(e.target.value)}
                            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-indigo-950 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[12px] font-black text-slate-400 uppercase">Surname</span>
                        <input
                            type="text"
                            placeholder="Surname" 
                            value={newAdminSurname}
                            onChange={(e) => setNewAdminSurname(e.target.value)}
                            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-indigo-950 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[12px] font-black text-slate-400 uppercase">Email</span>
                        <input
                            type="text"
                            placeholder="admin@example.com" 
                            value={newAdminEmail}
                            onChange={(e) => setNewAdminEmail(e.target.value)}
                            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-indigo-950 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-2">
                <button
                    onClick={() => setShowAddNewAdminModal(false)}
                    className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                    Cancel
                </button>
                <button
                    onClick={handleAddNewAdmin}
                    disabled={!newAdminName && !newAdminSurname && !newAdminEmail}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm"
                >
                    Add Admin
                </button>
                </div>
            </div>
            </div>
        )}
        </main>

    )
}