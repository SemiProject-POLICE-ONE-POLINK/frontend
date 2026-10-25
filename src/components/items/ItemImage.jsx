import { useEffect, useState } from 'react';
import { getItemImage } from '../../api/items';

/*
 * 서버 DB의 imagePath는 로컬 파일의 절대 경로라 브라우저에 그대로 전달할 수 없다.
 * 인증이 적용된 이미지 조회 API에서 Blob을 받아 임시 URL로 만들고, 컴포넌트가 사라질 때
 * URL을 해제해 목록을 오래 본 경우에도 브라우저 메모리가 누적되지 않게 한다.
 */
export default function ItemImage({ itemId, alt }) {
    const [image, setImage] = useState({ itemId: '', src: '', failed: false });

    useEffect(() => {
        let active = true;
        let objectUrl = '';

        getItemImage(itemId)
            .then((imageBlob) => {
                objectUrl = URL.createObjectURL(imageBlob);
                if (active) {
                    setImage({ itemId, src: objectUrl, failed: false });
                } else {
                    URL.revokeObjectURL(objectUrl);
                }
            })
            .catch(() => {
                if (active) {
                    setImage({ itemId, src: '', failed: true });
                }
            });

        return () => {
            active = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [itemId]);

    if (image.itemId === itemId && image.src) {
        return <img src={image.src} alt={alt} />;
    }

    return <span>{image.itemId === itemId && image.failed ? '이미지를 불러오지 못했습니다.' : '이미지를 불러오는 중…'}</span>;
}
