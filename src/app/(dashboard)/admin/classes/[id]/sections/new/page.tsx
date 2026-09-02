"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Class } from "@/types/database";

export default function AdminNewSectionPage() {
  const params = useParams();
  const classId = params.id as string;

  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    capacity: "40",
  });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchClass = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, school_id")
        .eq("id", session.user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        router.push("/login");
        return;
      }

      const { data: classData } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId)
        .eq("school_id", profile.school_id)
        .single();

      if (!classData) {
        setError("Class not found.");
        setIsLoading(false);
        return;
      }

      setClassInfo(classData);
      setIsLoading(false);
    };

    fetchClass();
  }, [supabase, router, classId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", session.user.id)
      .single();

    if (!profile) {
      setError("Unable to verify admin permissions.");
      setIsSaving(false);
      return;
    }

    const capacity = parseInt(formData.capacity, 10);
    if (isNaN(capacity) || capacity <= 0 || capacity > 200) {
      setError("Capacity must be between 1 and 200.");
      setIsSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("sections").insert({
      school_id: profile.school_id,
      class_id: classId,
      name: formData.name,
      capacity,
    });

    if (insertError) {
      setError("Failed to add section. Please try again.");
      setIsSaving(false);
    } else {
      router.push(`/admin/classes/${classId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-muted-foreground">Class not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/classes/${classId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Section</h1>
          <p className="text-muted-foreground">
            Add a new section to {classInfo.name}.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Section Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Section Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Section A"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity *</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  max="200"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <Link href={`/admin/classes/${classId}`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Adding..." : "Add Section"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
