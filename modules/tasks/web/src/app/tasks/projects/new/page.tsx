"use client";

import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import ProjectForm from "@/components/tasks/project-form";
import { projectApi } from "@/lib/tasks/api";
import type { ProjectCreateInput } from "@/lib/tasks/types";

// =============================================================================
// Page Component
// =============================================================================

export default function NewProjectPage() {
  const router = useRouter();

  const handleSubmit = async (data: ProjectCreateInput) => {
    const project = await projectApi.create(data as ProjectCreateInput);
    router.push(`/tasks/projects/${project.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Tasks", href: "/tasks" },
            { label: "Projects", href: "/tasks/projects" },
            { label: "New Project" },
          ]}
        />

        <h1 className="mt-6 text-2xl font-bold text-foreground">
          New Project
        </h1>
        <p className="mt-1 text-muted-foreground">
          Create a new project to organize your tasks
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          <ProjectForm
            onSubmit={handleSubmit}
            onCancel={() => router.push("/tasks/projects")}
          />
        </div>
      </div>
    </div>
  );
}
