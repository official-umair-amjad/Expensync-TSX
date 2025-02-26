"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../utils/supabaseClient";

interface Group {
  id: string;
  name: string;
  description: string;
}

interface Membership {
  group_id: string;
  groups: Group;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [showAddGroup, setShowAddGroup] = useState<boolean>(false);
  const [newGroup, setNewGroup] = useState<{ name: string; description: string }>({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (!user) {
      router.push("/");
    } else {
      console.log("userID:", user.id);
      fetchGroups();
    }
  }, [user, router]);

  const fetchGroups = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("memberships")
      .select("group_id, groups(*)")
      .eq("user_id", user.id);

    if (error) {
      console.error("Fetch Groups Error:", error.message);
      return;
    }

    setGroups(
      (data as Membership[]).map((entry) => entry.groups).filter((group) => group)
    );
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      console.error("User is not authenticated");
      return;
    }

    const { name, description } = newGroup;

    const { data, error } = await supabase
      .from("groups")
      .insert([{ name, description, admin_id: user.id }])
      .select();

    if (error || !data?.length) {
      console.error("Insert Error:", error?.message);
      return;
    }

    const { error: membershipError } = await supabase
      .from("memberships")
      .insert([{ user_id: user.id, group_id: data[0].id, role: "admin" }]);

    if (membershipError) {
      console.error("Membership Insert Error:", membershipError.message);
      return;
    }

    setGroups([...groups, data[0]]);
    setNewGroup({ name: "", description: "" });
    setShowAddGroup(false);
  };

  return (
    <div className="min-h-screen lg:p-8 px-5">
      <header className="flex items-center justify-between w-full">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="px-4 py-2 bg-red-500 hover:bg-red-700 text-white rounded"
        >
          Logout
        </button>

      </header>
      <section className="mt-8 absolute right-10">
        <button
          onClick={() => setShowAddGroup(!showAddGroup)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded"
        >
          {showAddGroup ? "X" : "Add"}
        </button>
      </section>

      {showAddGroup && (
        <section className="mt-4 bg-white p-6 rounded shadow lg:absolute lg:right-24 lg:top-24">
          <h2 className="text-xl font-semibold mb-4">Create a New Group</h2>
          <form onSubmit={handleAddGroup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Group Name</label>
              <input
                type="text"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md"
            >
              Create Group
            </button>
          </form>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Your Groups</h2>
        {groups.length === 0 ? (
          <p>You are not a member of any groups yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex bg-white px-4 py-2 rounded shadow hover:shadow-lg transition items-center"
              >
                <div className="w-3/4">

                  <h3 className="text-xl font-bold text-indigo-500">{group.name}</h3>
                  <p className="mb-2 text-gray-600">{group.description}</p>
                </div>

                <div className="w-1/4 justify-center">

                  <Link href={`/groups/${group.id}`} className="bg-indigo-500 hover:bg-indigo-700 text-white p-2 rounded">
                    Expenses
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
