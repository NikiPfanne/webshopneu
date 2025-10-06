#!/bin/sh

# MinIO als Host hinzufügen, warte ggf. bis er verfügbar ist
until (mc config host add minio http://minio:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD}); do
    echo '...waiting for MinIO...'
    sleep 1
done

# Buckets erstellen
mc mb -p minio/images || true
mc mb -p minio/videos || true

# Buckets öffentlich machen (für Bildzugriffe ohne Authentifizierung)
mc anonymous set public minio/images ||
    echo "Warning: Could not set public access policy for images. You may need to set it manually in the MinIO console at http://localhost:9001"

mc anonymous set public minio/videos ||
    echo "Warning: Could not set public access policy for videos. You may need to set it manually in the MinIO console at http://localhost:9001"

# Seed-Bilder hochladen (wenn vorhanden)
if [ -d "/seed-images" ] && [ "$(ls -A /seed-images)" ]; then
    echo "Uploading seed images to 'images' bucket with Cache-Control..."

    for file in /seed-images/*; do
        filename=$(basename "$file")
        mime=$(file --mime-type -b "$file")

        mc cp --attr "Cache-Control=public,max-age=604800" \
            --attr "Content-Type=$mime" \
            "$file" "minio/images/$filename"
    done

    echo "✅ Seed images uploaded with caching headers!"
else
    echo "⚠️  No seed images found in /seed-images"
fi

# Seed-Videos hochladen (wenn vorhanden)
if [ -d "/seed-videos" ] && [ "$(ls -A /seed-videos)" ]; then
    echo "Uploading seed videos to 'videos' bucket..."

    for file in /seed-videos/*; do
        filename=$(basename "$file")
        mime=$(file --mime-type -b "$file")

        mc cp --attr "Cache-Control=public,max-age=86400" \
            --attr "Content-Type=$mime" \
            "$file" "minio/videos/$filename"
    done

    echo "✅ Seed videos uploaded!"
else
    echo "⚠️  No seed videos found in /seed-videos"
fi

echo "✅ MinIO initialization complete!"
echo "🔗 Access uploaded files via: http://localhost:9000/images/<filename>"
echo "🎥 Access uploaded videos via: http://localhost:9000/videos/<filename>"
