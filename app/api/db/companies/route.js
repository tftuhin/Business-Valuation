import { upsertCompany, deleteCompany } from '../../../lib/db';

export async function POST(request) {
  try {
    const company = await request.json();
    if (!company || !company.id || !company.name) {
      return Response.json({ success: false, error: 'Invalid company payload' }, { status: 400 });
    }
    await upsertCompany(company);
    return Response.json({ success: true, company });
  } catch (err) {
    console.error('Error saving company:', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return Response.json({ success: false, error: 'Missing company id parameter' }, { status: 400 });
    }
    await deleteCompany(id);
    return Response.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('Error deleting company:', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
