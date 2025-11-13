import { NextResponse } from 'next/server';
import prisma from "@/app/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        displayName: true,
        email: true,
        age: true,
        gender: true,
        region: true,
        avatar: true,
        role: true,
        birthday: true,
        createdTime: true,
        updatedAt: true,
        status: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { 
      region, 
      email, 
      age, 
      gender, 
      displayName, 
      status, 
      role, 
      avatar,
      birthday
    } = await req.json();
    
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        displayName,
        email,
        age,
        gender,
        role,
        status,
        avatar: avatar || undefined,
        birthday: birthday ? new Date(birthday).toISOString().split('T')[0] : undefined,
        region: region || undefined,
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        age: true,
        gender: true,
        region: true,
        avatar: true,
        role: true,
        birthday: true,
        createdTime: true,
        updatedAt: true,
        status: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 先删除关联的骑行记录路线
    await prisma.rideRecordRoute.deleteMany({
      where: { userId: params.id },
    });

    // 再删除关联的手动创建的路线
    await prisma.manualCreatedRoute.deleteMany({
      where: { userId: params.id },
    });

    // 最后删除用户
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
