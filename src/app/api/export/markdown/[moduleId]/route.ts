import { getModuleTraces, getModuleWithCount } from '@/lib/queries/module-traces'
import { generateMarkdown } from '@/lib/export/markdown'
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

  // Generate markdown content
  const markdown = generateMarkdown(module, traces)
  const filename = generateSafeFilename(module.name, 'md')

  // Return file with proper headers
  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
