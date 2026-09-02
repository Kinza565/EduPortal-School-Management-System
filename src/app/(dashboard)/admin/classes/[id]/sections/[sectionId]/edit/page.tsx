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
import type { Class, Section } from "@/types/database";

export default function AdminEditSectionPage() {
  const params = useParams();
  const classId = params.id as string;
  const sectionId = params.sectionId as string;

  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    capacity: "40",
    is_active: true,
  });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
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

      const [classRes, sectionRes] = await Promise.all([
        supabase
          .from("classes")
          .select("*")
          .eq("id", classId)
          .eq("school_id", profile.school_id)
          .single(),
        supabase
          .from("sections")
          .select("*")
          .eq("id", sectionId)
          .eq("class_id", classId)
          .eq("school_id", profile.school_id)
          .single(),
      ]);

      if (classRes.error || !classRes.data) {
        setError("Class not found.");
        setIsLoading(false);
        return;
      }

      if (sectionRes.error || !sectionRes.data) {
        setError("Section not found.");
        setIsLoading(false);
        return;
      }

      setClassInfo(classRes.data);
      setSection(sectionRes.data);
      setFormData({
        name: sectionRes.data.name,
        capacity: sectionRes.data.capacity.toString(),
        is_active: sectionRes.data.is_active,
      });
      setIsLoading(false);
    };

    fetchData();
  }, [supabase, router, classId, sectionId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const capacity = parseInt(formData.capacity, 10);
    if (isNaN(capacity) || capacity <= 0 || capacity > 200) {
      setError("Capacity must be between 1 and 200.");
      setIsSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("sections")
      .update({
        name: formData.name,
        capacity,
        is_active: formData.is_active,
      })
      .eq("id", sectionId);

    if (updateError) {
      setError("Failed to update section. Please try again.");
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

  if (!classInfo || !section) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-muted-foreground">Section not found.</div>
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Section</h1>
          <p className="text-muted-foreground">
            Edit {section.name} in {classInfo.name}.
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
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            <div className="flex justify-end gap-4">
              <Link href={`/admin/classes/${classId}`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
