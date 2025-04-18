// App.js
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { Camera } from "expo-camera";

export default function App() {
  // Todo 列表与输入文本
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");

  // 当前位置
  const [location, setLocation] = useState(null);

  // 相机状态
  const [hasCamPerm, setHasCamPerm] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [showCamera, setShowCamera] = useState(false);

  // 初始化：请求权限并加载持久化数据
  useEffect(() => {
    (async () => {
      // 请求相机权限
      const camStatus = await Camera.requestCameraPermissionsAsync();
      setHasCamPerm(camStatus.status === "granted");

      // 请求定位权限
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      }

      // 从本地读取已存储的 todos
      const json = await AsyncStorage.getItem("@todos");
      if (json) setTodos(JSON.parse(json));
    })();
  }, []);

  // 每次 todos 变更就同步到本地存储
  useEffect(() => {
    AsyncStorage.setItem("@todos", JSON.stringify(todos));
  }, [todos]);

  // 添加一条 Todo
  const addTodo = () => {
    if (!text.trim()) return;
    setTodos([{ id: Date.now().toString(), title: text.trim() }, ...todos]);
    setText("");
  };

  // 长按删除 Todo
  const deleteTodo = (id) => {
    setTodos(todos.filter((t) => t.id !== id));
  };

  // 拍照并收集照片 URI
  const takePhoto = async () => {
    if (cameraRef) {
      const photo = await cameraRef.takePictureAsync();
      setPhotoUri(photo.uri);
      setShowCamera(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 标题 */}
      <Text style={styles.heading}>📋 Todo++（位置 + 相机）</Text>

      {/* 显示定位信息 */}
      {location && (
        <Text style={styles.coords}>
          📍 Lat: {location.latitude.toFixed(4)}   Lng:{" "}
          {location.longitude.toFixed(4)}
        </Text>
      )}

      {/* 输入框 + 添加按钮 */}
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Add a task..."
          value={text}
          onChangeText={setText}
          onSubmitEditing={addTodo}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addTodo}>
          <Text style={styles.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Todo 列表 */}
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onLongPress={() => deleteTodo(item.id)}>
            <Text style={styles.todo}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />

      {/* 相机  /  打开相机按钮 */}
      {showCamera ? (
        <Camera style={styles.camera} ref={setCameraRef} ratio="4:3">
          <TouchableOpacity style={styles.snapBtn} onPress={takePhoto} />
        </Camera>
      ) : (
        <TouchableOpacity
          style={styles.photoBtn}
          onPress={() =>
            hasCamPerm ? setShowCamera(true) : Alert.alert("没有相机权限")
          }
        >
          <Text style={styles.photoBtnText}>打开相机</Text>
        </TouchableOpacity>
      )}

      {/* 展示拍摄的照片 */}
      {photoUri && (
        <Image
          source={{ uri: photoUri }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#f9f9ff" },
  heading: { fontSize: 22, fontWeight: "bold", marginBottom: 12, color: "#333" },
  coords: { fontSize: 12, marginBottom: 8, color: "#666" },
  row: { flexDirection: "row", marginBottom: 12 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    backgroundColor: "#fff",
  },
  addBtn: {
    width: 42,
    height: 42,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: "#4f8ef7",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontSize: 24, lineHeight: 26 },
  todo: {
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 6,
    borderRadius: 8,
    fontSize: 16,
  },
  photoBtn: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#4f8ef7",
    alignItems: "center",
  },
  photoBtnText: { color: "#fff", fontSize: 16 },
  camera: { flex: 1, aspectRatio: 3 / 4, marginTop: 12, borderRadius: 8, overflow: "hidden" },
  snapBtn: {
    flex: 1,
    borderWidth: 4,
    borderColor: "#fff",
    borderRadius: 50,
    alignSelf: "center",
    width: 70,
    marginBottom: 30,
  },
  thumbnail: { marginTop: 12, width: "100%", height: 200, borderRadius: 8 },
});

