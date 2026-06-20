export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return new Response('Missing url', { status: 400 });
    }

    try{
        const image = await fetch(imageUrl);
        if (!image.ok) {
            return new Response('Error fetching image', {
                status: 500
                })
        }
        const buffer = await image.arrayBuffer();
        const contentType = image.headers.get('content-type') ?? 'image/jpeg';

        return new Response(
            buffer, {
            headers: { 
                'Content-Type': contentType ,
            },
        });
    } catch{
       return new Response('Error fetching image', {
        status: 500
       })
    }
}