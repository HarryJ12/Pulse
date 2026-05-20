import Link from "next/link";
import { FolderPlus } from "lucide-react";

import { ProjectCard } from "@/components/pulse/project-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";
import { getProjects } from "@/lib/queries";

export default async function ProjectsPage() {
  const { supabase } = await requireUser();
  const projects = await getProjects(supabase);

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold">Projects</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Lightweight rooms that collect context, member activity, and related
            discussions for a cohort build.
          </p>
        </div>
        <Button asChild variant="primary">
          <Link href="/projects/new">
            <FolderPlus aria-hidden="true" />
            New project
          </Link>
        </Button>
      </header>

      {projects.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderPlus}
          title="No projects yet"
          description="Create a room for a prototype, open-source repo, cohort experiment, or team build."
          action={
            <Button asChild variant="primary">
              <Link href="/projects/new">Create project</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
