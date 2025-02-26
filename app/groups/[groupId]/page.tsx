"use client";
import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import ExpenseDisplay from "../../../components/CurrencyConverter";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../utils/supabaseClient";
import { Trash, Edit2, Plus } from "lucide-react";

// Define types for our data
type Group = {
  id: string;
  name: string;
  admin_id: string;
};

type Profile = {
  id: string;
  email: string;
  full_name?: string;
};

type GroupMember = {
  user_id: string;
  role: string;
};

type Expense = {
  id: string;
  description: string;
  amount: string;
  category: string;
  date: string;
  user_id: string;
};

export default function GroupDetails() {
  const { user } = useAuth();
  const router = useRouter();
  const { groupId } = useParams();

  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [userDetails, setUserDetails] = useState<Record<string, Profile>>({});
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [userExpenseCount, setUserExpenseCount] = useState<Record<string, number>>({});
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    description: "",
    amount: "",
    category: "",
    date: "",
  });

  // For editing an existing expense
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // For toggling the Add section on mobile
  const [showMobileAdd, setShowMobileAdd] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      router.push("/");
    } else if (groupId) {
      async function fetchAllData() {
        // Fetch group members, expenses, and group details concurrently
        const [members, expensesData, groupData] = await Promise.all([
          fetchGroupMembers(),
          fetchExpenses(),
          fetchGroupDetails(),
        ]);
        if (groupData) {
          setGroup(groupData);
        }
        // Now fetch user details with both expenses and members
        await fetchUserDetails(expensesData, members);
      }
      fetchAllData();
    }
  }, [user, router, groupId]);

  const fetchGroupDetails = async (): Promise<Group | null> => {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();
    if (!error && data) {
      return data;
    }
    return null;
  };

  const fetchExpenses = async (): Promise<Expense[]> => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("group_id", groupId);
    if (!error && data) {
      setExpenses(data);
      // Calculate total expense
      const total = data.reduce(
        (sum: number, exp: Expense) => sum + parseFloat(exp.amount || "0"),
        0
      );
      setTotalExpense(total);
      return data;
    }
    return [];
  };

  const fetchGroupMembers = async (): Promise<GroupMember[]> => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members`);
      if (!response.ok) {
        throw new Error("Failed to fetch group members");
      }
      const data = await response.json();
      const members = data.members || [];
      setGroupMembers(members);
      return members;
    } catch (error) {
      console.error("Error fetching group members:", error);
      setGroupMembers([]);
      return [];
    }
  };

  // const handleRemoveMember = async (userId: string) => {
  //   try {
  //     const response = await fetch(`/api/groups/${groupId}/members/${userId}`, {
  //       method: "DELETE",
  //       headers: { "Content-Type": "application/json" },
  //     });
  //     if (response.ok) {
  //       // Remove the member from the local state so the UI updates immediately
  //       setGroupMembers((prevMembers) =>
  //         prevMembers.filter((member) => member.user_id !== userId)
  //       );
  //       console.log(`Member ${userId} removed successfully.`);
  //     } else {
  //       console.error("Failed to remove member.");
  //     }
  //   } catch (error) {
  //     console.error("Error removing member:", error);
  //   }
  // };

  // Combine user IDs from expenses and group members for a complete list.
  const fetchUserDetails = async (expenses: Expense[], members: GroupMember[]) => {
    const expenseUserIds = expenses.map((exp) => exp.user_id);
    const memberUserIds = (members || []).map((member) => member.user_id);
    const userIds = [...new Set([...expenseUserIds, ...memberUserIds])];

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds);
    if (!error && data) {
      const details: Record<string, Profile> = Object.fromEntries(
        data.map((user: Profile) => [user.id, user])
      );
      setUserDetails(details);

      // Count expenses per user
      const expenseCount = expenses.reduce((acc: Record<string, number>, exp) => {
        acc[exp.user_id] = (acc[exp.user_id] || 0) + parseFloat(exp.amount || "0");
        return acc;
      }, {});
      setUserExpenseCount(expenseCount);
    }
  };

  const handleAddExpense = async (e: FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from("expenses")
      .insert([
        {
          ...newExpense,
          group_id: groupId,
          user_id: user.id,
        },
      ])
      .select();

    if (!error && data && data[0]) {
      const added: Expense = data[0];
      setExpenses([...expenses, added]);
      setNewExpense({ description: "", amount: "", category: "", date: "" });

      // Update total expense and user expense count
      setTotalExpense((prev) => prev + parseFloat(added.amount || "0"));
      setUserExpenseCount((prev) => ({
        ...prev,
        [user.id]: (prev[user.id] || 0) + parseFloat(added.amount || "0"),
      }));
    }
  };

  // DELETE expense
  const handleDeleteExpense = async (expenseId: string, amount: string, userId: string) => {
    const response = await fetch(`/api/expenses/${expenseId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id }),
    });

    if (response.ok) {
      setExpenses(expenses.filter((exp) => exp.id !== expenseId));
      setTotalExpense((prev) => prev - parseFloat(amount || "0"));
      setUserExpenseCount((prev) => ({
        ...prev,
        [userId]: Math.max(0, (prev[userId] || 0) - parseFloat(amount || "0")),
      }));
    }
  };

  // EDIT expense (open modal)
  const handleEditExpense = (expense: Expense) => {
    setEditingExpense({ ...expense }); // clone to avoid direct mutation
    setIsEditing(true);
  };

  // UPDATE expense
  const handleUpdateExpense = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    const { id: expenseId, user_id, ...rest } = editingExpense;
    const response = await fetch(`/api/expenses/${expenseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        ...rest,
      }),
    });

    if (response.ok) {
      // Update local state with updated expense
      const updatedExpenses = expenses.map((exp) =>
        exp.id === expenseId ? { ...exp, ...rest } : exp
      );

      // Recalculate total expense
      const newTotal = updatedExpenses.reduce(
        (sum, exp) => sum + parseFloat(exp.amount || "0"),
        0
      );

      // Recalculate userExpenseCount
      const newCounts = updatedExpenses.reduce((acc: Record<string, number>, exp) => {
        acc[exp.user_id] = (acc[exp.user_id] || 0) + parseFloat(exp.amount || "0");
        return acc;
      }, {});

      setExpenses(updatedExpenses);
      setTotalExpense(newTotal);
      setUserExpenseCount(newCounts);

      setIsEditing(false);
      setEditingExpense(null);
    }
  };

  const inviteUser = async () => {
    setMessage("");
    if (!email) return setMessage("Please enter an email.");
    try {
      const response = await fetch(`/api/groups/${groupId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (response.ok) {
        setEmail("");
      }
      setMessage(response.ok ? result.message : result.error || "Error inviting user.");
    } catch (error) {
      setMessage("Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen lg:p-8 relative">
      {/* Back button */}
      <Link
        href="/dashboard"
        className="ml-5 bg-green-600 hover:bg-green-700 text-white hidden lg:inline font-semibold py-2 px-4 rounded"
      >
        Back
      </Link>

      {group && (
        <div className="text-center ">
          <h1 className="text-3xl font-bold">{group.name} Group</h1>
        </div>
      )}

      <div className="md:flex w-full gap-4 p-5">
        {/* Left / Main section */}
        <section className="lg:w-3/4">
          {/* Top row with total expense & group members */}
          <div className="flex gap-2 mb-2">
            <ExpenseDisplay totalExpense={totalExpense} />
          </div>

          <h3 className="text-md font-semibold border-b">Expenses</h3>
          {expenses.length === 0 ? (
            <p>No expenses yet.</p>
          ) : (
            <ul>
              {expenses.map((expense) => (
                <li
                  key={expense.id}
                  className="p-4 mt-2 bg-black shadow-sm rounded flex justify-between items-center"
                >
                  <div>
                    <strong>{expense.description}</strong> - ${expense.amount} (
                    {expense.category})
                    {userDetails[expense.user_id] ? (
                      <p className="text-gray-500 text-sm">
                        {userDetails[expense.user_id].email}
                      </p>
                    ) : (
                      <p className="text-gray-500 text-sm">Loading user info...</p>
                    )}
                    <p className="text-gray-500 text-sm">{expense.date}</p>
                  </div>
                  {user && expense.user_id === user.id && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEditExpense(expense)}
                        className="text-green-400 hover:text-green-500"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteExpense(expense.id, expense.amount, expense.user_id)
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash size={20} />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Group Members Section */}
          <h3 className="text-md font-semibold mt-2 border-b">Group Members</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {(groupMembers || []).map((member) => {
              const userObj = userDetails[member.user_id];
              return (
                <div
                  key={member.user_id}
                  className="relative bg-white text-xs h-min p-2 rounded shadow"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-lg text-indigo-500">
                      ${userExpenseCount[member.user_id] || 0}
                    </p>
                    {group && user?.id === group.admin_id && (
                      <button
                        onClick={() => {
                          alert(
                            `In new docs, deleting is not required. so just displaying the: ${member.user_id}`
                          );
                        }}
                      >
                        <Trash size={12} color="red" />
                      </button>
                    )}
                  </div>
                  <p>{userObj ? userObj.email : "Loading..."}</p>
                  <p>{member.role}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right sidebar - hidden on small screens */}
        <section className="hidden md:block border-l md:w-1/4 p-2">
          {user && group?.admin_id === user.id && (
            <div className="border-b pb-5">
              <h3 className="mb-2">Add Users:</h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter user email"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  className="border p-2 w-full rounded"
                />
                <button
                  onClick={inviteUser}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
                >
                  Invite
                </button>
              </div>
              {message && <p className="mt-2 text-sm text-blue-500">{message}</p>}
            </div>
          )}
          <div className="mt-2">
            <h3 className="mb-2">Add Expense:</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              {Object.keys(newExpense).map((key) => (
                <input
                  key={key}
                  type={
                    key === "amount"
                      ? "number"
                      : key === "date"
                      ? "date"
                      : "text"
                  }
                  placeholder={key}
                  value={newExpense[key as keyof Expense] as string | number}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewExpense({ ...newExpense, [key]: e.target.value })
                  }
                  className="border p-2 w-full rounded"
                  required
                />
              ))}
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded"
              >
                Add Expense
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* FLOATING PLUS BUTTON - visible on small screens only */}
      <button
        onClick={() => setShowMobileAdd(true)}
        className="md:hidden fixed bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full"
      >
        <Plus size={24} />
      </button>

      {/* MOBILE ADD SECTION (MODAL) */}
      {showMobileAdd && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-4 w-11/12 max-w-sm rounded shadow relative">
            {/* Close button */}
            <button
              onClick={() => setShowMobileAdd(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
            >
              ✕
            </button>

            {/* If admin, show 'Add Users' */}
            {user && group?.admin_id === user.id && (
              <div className="border-b pb-5 mb-4">
                <h3 className="mb-2 font-semibold">Add Users:</h3>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter user email"
                    value={email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    className="border p-2 w-full rounded"
                  />
                  <button
                    onClick={inviteUser}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
                  >
                    Invite
                  </button>
                </div>
                {message && <p className="mt-2 text-sm text-blue-500">{message}</p>}
              </div>
            )}

            {/* Add Expense form */}
            <div>
              <h3 className="mb-2 font-semibold">Add Expense:</h3>
              <form onSubmit={handleAddExpense} className="space-y-4">
                {Object.keys(newExpense).map((key) => (
                  <input
                    key={key}
                    type={
                      key === "amount"
                        ? "number"
                        : key === "date"
                        ? "date"
                        : "text"
                    }
                    placeholder={key}
                    value={newExpense[key as keyof Expense] as string | number}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setNewExpense({ ...newExpense, [key]: e.target.value })
                    }
                    className="border p-2 w-full rounded"
                    required
                  />
                ))}
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded w-full"
                >
                  Add Expense
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT EXPENSE MODAL */}
      {isEditing && editingExpense && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          {/* Modal Content */}
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md relative">
            <h2 className="text-lg font-bold mb-4">Edit Expense</h2>
            <form onSubmit={handleUpdateExpense} className="space-y-3">
              <input
                type="text"
                className="border p-2 w-full rounded"
                placeholder="Description"
                value={editingExpense.description}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEditingExpense({
                    ...editingExpense,
                    description: e.target.value,
                  })
                }
                required
              />
              <input
                type="number"
                className="border p-2 w-full rounded"
                placeholder="Amount"
                value={editingExpense.amount}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEditingExpense({
                    ...editingExpense,
                    amount: e.target.value,
                  })
                }
                required
              />
              <input
                type="text"
                className="border p-2 w-full rounded"
                placeholder="Category"
                value={editingExpense.category}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEditingExpense({
                    ...editingExpense,
                    category: e.target.value,
                  })
                }
                required
              />
              <input
                type="date"
                className="border p-2 w-full rounded"
                placeholder="Date"
                value={editingExpense.date}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEditingExpense({
                    ...editingExpense,
                    date: e.target.value,
                  })
                }
                required
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="bg-gray-300 text-black font-semibold py-2 px-4 rounded"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingExpense(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
