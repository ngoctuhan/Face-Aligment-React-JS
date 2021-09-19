
function distance_two_point_2D(point1, point2){

  /*
    - l2 distance of 2 point in 2D

    d * d = (x1 - x1) ** 2 + (y1-y2) ** 2
  */
  
  let tmp = Math.pow(point1[0] -  point2[0], 2) + Math.pow(point1[1] - point2[1], 2);

  return Math.sqrt(tmp);

};

export function check_angel_face(predictions) {

    /* 
    Check angle of face 1: LEFT, 2: RIGHT, 3: UP, 0: DOWN OR NORMAL
     */
    const keypoints = predictions[0].scaledMesh;

    const [t_x, t_y, t_z] = keypoints[168];

    const [c_x, c_y, c_z] = keypoints[4];

    const [b_x, b_y, b_z] =  keypoints[13];

    let distance_ct = distance_two_point_2D([t_x, t_y, t_z], [c_x, c_y, c_z]);

    let distance_cb = distance_two_point_2D([c_x, c_y, c_z], [b_x, b_y, b_z]);

    const [n_x, n_y, n_z] = keypoints[5];

    const bounding_boxes = predictions[0].boundingBox;

    const tl_x =  bounding_boxes.topLeft[0];

    const bt_x =  bounding_boxes.bottomRight[0];

    const w = bt_x - tl_x;

    if(n_x >  tl_x + 0.7 * w) {

      return 1;
    }
    
    else if (n_x < tl_x + 0.3 * w){
      return 2;
    }

    if (distance_cb > 1.3 * distance_ct){
      return 3;
    }


    return 0;
};

export function check_mouth_activate(predictions){

  /*
  Check mouth is open to talk 
  */
  const keypoints = predictions[0].scaledMesh;

  const [top_x, top_y, top_z] = keypoints[13];
  
  const [bottom_x, bottom_y, bottom_z] = keypoints[14];

  let range_lip = distance_two_point_2D([top_x, top_y, top_z], [bottom_x, bottom_y, bottom_z]);

  
  if( range_lip > 6){
    return 1;
  }
  else{
    return 0;
  }
}