import { db } from "@/db";
import { modules, resources } from "@/db/schema";
import { asc, count } from "drizzle-orm";
import { ModuleForm } from "@/components/admin/module-form";
import { ResourceForm } from "@/components/admin/resource-form";

async function getAdminData() {
  const allModules = await db.query.modules.findMany({
    orderBy: [asc(modules.order)],
    with: { resources: { columns: { id: true } } },
  });

  const allResources = await db.query.resources.findMany({
    orderBy: [asc(resources.order)],
    with: { module: { columns: { title: true } } },
  });

  return { modules: allModules, resources: allResources };
}

export default async function AdminPage() {
  const { modules: allModules, resources: allResources } = await getAdminData();

  const moduleList = allModules.map((m) => ({
    id: m.id,
    title: m.title,
    color: m.color,
    icon: m.icon,
    description: m.description,
    _count: { resources: m.resources.length },
  }));

  const resourceList = allResources.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    difficulty: r.difficulty,
    moduleId: r.moduleId,
    module: r.module,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Content Management</h2>
        <p className="text-muted-foreground mt-1">
          Create and manage your study modules and resources.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleForm existingModules={moduleList} />
        <ResourceForm
          modules={allModules.map((m) => ({ id: m.id, title: m.title }))}
          existingResources={resourceList}
        />
      </div>
    </div>
  );
}
