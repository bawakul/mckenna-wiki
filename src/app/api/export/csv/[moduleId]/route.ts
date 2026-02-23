import { getModuleTraces, getModuleWithCount } from '@/lib/queries/module-traces'
import { generateCSV } from '@/lib/export/csv'
import { generateSafeFilename } from '@/lib/export/filename'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  const { moduleId } = await params

  // Parallel fetch module and traces
  const [module, traces] = await Promise.all([
    getModuleWithCount(moduleId),
    getModuleTraces(moduleId)
  ])

  if (!module) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  }

  // Generate CSV content
  const csv = generateCSV(module.name, traces)
  const filename = generateSafeFilename(module.name, 'csv')

  // Return file with proper headers
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
